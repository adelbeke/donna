import { app, ipcMain, BrowserWindow, Notification, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { runGh } from './gh'
import { createWindow } from './main'
import {
  buildSearchQuery,
  diffNewIds,
  filterDrafts,
  filterMuted,
  filterSelectedRepos,
  formatCheckStateNotification,
  formatNewPRNotification,
  formatReviewNotification,
  isNotifiableReviewState,
  isTerminalCheckState,
} from './notificationCopy'
import type {
  ChecksSection,
  CheckRollupState,
  NotificationCategory,
  NotificationSection,
  ReviewState,
} from './notificationCopy'

export type { NotificationCategory }

export type NotificationSettings = {
  enabledCategories: NotificationCategory[]
  pollIntervalMs: number
  openPRsInDonna: boolean
  hiddenAuthors: string[]
  hiddenRepos: string[]
  selectedReposByCategory: Record<NotificationSection, string[]>
  showDraftsByCategory: Record<NotificationSection, boolean>
  checksEnabled: Record<ChecksSection, boolean>
  reviewLeftEnabled: boolean
}

export type NotificationNavigatePayload = { route: string } | { section: NotificationCategory }

type Review = { id: string; state: ReviewState; author: { login: string } | null }

type NotificationPR = {
  id: string
  number: number
  title: string
  url: string
  isDraft: boolean
  checkState: CheckRollupState | null
  reviews: Review[]
  author: { login: string } | null
  repository: { nameWithOwner: string }
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabledCategories: ['review-requested', 'assigned'],
  pollIntervalMs: 5 * 60_000,
  openPRsInDonna: true,
  hiddenAuthors: [],
  hiddenRepos: [],
  selectedReposByCategory: {
    'review-requested': [],
    assigned: [],
    reviewed: [],
    authored: [],
  },
  showDraftsByCategory: {
    'review-requested': false,
    assigned: false,
    reviewed: false,
    authored: true,
  },
  // opt-in: unlike new-PR notifications, per-check-state notifications can fire often on an
  // active PR (every re-run), so we don't turn this on until the user asks for it in Settings
  checksEnabled: { authored: false, assigned: false },
  reviewLeftEnabled: false,
}

type PersistedState = {
  settings: NotificationSettings
  seenIds: Partial<Record<NotificationCategory, string[]>>
  lastCheckState: Partial<Record<ChecksSection, Record<string, CheckRollupState | null>>>
  // PR id -> review ids already notified about (or seeded on first sighting of that PR)
  seenReviewIds: Record<string, string[]>
}

const DEFAULT_STATE: PersistedState = {
  settings: DEFAULT_SETTINGS,
  seenIds: {},
  lastCheckState: {},
  seenReviewIds: {},
}

const storePath = () => path.join(app.getPath('userData'), 'notifications.json')

const loadState = (): PersistedState => {
  try {
    const raw = fs.readFileSync(storePath(), 'utf-8')
    const parsed = JSON.parse(raw)
    return {
      settings: {
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
        selectedReposByCategory: {
          ...DEFAULT_SETTINGS.selectedReposByCategory,
          ...parsed.settings?.selectedReposByCategory,
        },
        showDraftsByCategory: {
          ...DEFAULT_SETTINGS.showDraftsByCategory,
          ...parsed.settings?.showDraftsByCategory,
        },
        checksEnabled: {
          ...DEFAULT_SETTINGS.checksEnabled,
          ...parsed.settings?.checksEnabled,
        },
      },
      seenIds: parsed.seenIds ?? {},
      lastCheckState: parsed.lastCheckState ?? {},
      seenReviewIds: parsed.seenReviewIds ?? {},
    }
  } catch {
    return DEFAULT_STATE
  }
}

const saveState = () => fs.writeFileSync(storePath(), JSON.stringify(state, null, 2))

let state: PersistedState = DEFAULT_STATE
let viewerLogin: string | null = null
let pollTimer: NodeJS.Timeout | null = null

const graphql = async <T>(query: string, variables: Record<string, unknown>): Promise<T> => {
  const out = await runGh(['api', 'graphql', '--input', '-'], JSON.stringify({ query, variables }))
  return JSON.parse(out) as T
}

const VIEWER_QUERY = `query { viewer { login } }`

const SEARCH_QUERY = `
  query NotificationSearch($searchQuery: String!) {
    search(query: $searchQuery, type: ISSUE, first: 20) {
      nodes {
        ... on PullRequest {
          id
          number
          title
          url
          isDraft
          author { login }
          repository { nameWithOwner }
          commits(last: 1) {
            nodes {
              commit {
                statusCheckRollup {
                  state
                }
              }
            }
          }
          reviews(last: 10) {
            nodes {
              id
              state
              author { login }
            }
          }
        }
      }
    }
  }
`

type RawSearchNode = Omit<NotificationPR, 'checkState' | 'reviews'> & {
  commits: { nodes: { commit: { statusCheckRollup: { state: CheckRollupState } | null } | null }[] }
  reviews: { nodes: Review[] }
}

const toNotificationPR = (raw: RawSearchNode): NotificationPR => ({
  id: raw.id,
  number: raw.number,
  title: raw.title,
  url: raw.url,
  isDraft: raw.isDraft,
  reviews: raw.reviews.nodes,
  author: raw.author,
  repository: raw.repository,
  checkState: raw.commits.nodes[0]?.commit?.statusCheckRollup?.state ?? null,
})

const ensureViewerLogin = async (): Promise<string | null> => {
  if (viewerLogin) return viewerLogin
  try {
    const res = await graphql<{ data: { viewer: { login: string } } }>(VIEWER_QUERY, {})
    viewerLogin = res.data.viewer.login
  } catch (e) {
    console.error('[notifications] viewer lookup failed', e)
    return null
  }
  return viewerLogin
}

const focusWindow = () => {
  const win = BrowserWindow.getAllWindows()[0] ?? createWindow()
  win.show()
  win.focus()
}

const sendNavigate = (payload: NotificationNavigatePayload) => {
  BrowserWindow.getAllWindows().forEach((w) =>
    w.webContents.send('notifications:navigate', payload)
  )
}

const handleSinglePRClick = (pr: NotificationPR) => {
  if (state.settings.openPRsInDonna) {
    const [owner, repo] = pr.repository.nameWithOwner.split('/')
    sendNavigate({ route: `/prs/${owner}/${repo}/${pr.number}` })
  } else {
    shell.openExternal(pr.url)
  }
}

// ponytail: Electron GCs a Notification with no surviving reference, silently killing its
// 'click' handler — hold one until it's dismissed/clicked so the click-through actually fires.
const liveNotifications = new Set<Notification>()

const fireNotification = (title: string, body: string, onClick: () => void) => {
  const notification = new Notification({ title, body })
  liveNotifications.add(notification)
  const release = () => liveNotifications.delete(notification)

  // ponytail: UNUserNotificationCenter can silently refuse an unsigned dev-mode Electron
  // bundle (UNErrorDomain error 1) — this only surfaces the failure, packaging is the fix.
  notification.on('failed', (_e, error) => {
    console.error('[notifications] failed', error)
    release()
  })
  notification.on('close', release)
  notification.on('click', () => {
    focusWindow()
    onClick()
    release()
  })
  notification.show()
}

const notifyNewPRs = (category: NotificationCategory, nodes: NotificationPR[]) => {
  const { title, body } = formatNewPRNotification(category, nodes)
  const onClick =
    nodes.length === 1
      ? () => handleSinglePRClick(nodes[0])
      : () => sendNavigate({ section: category })
  fireNotification(title, body, onClick)
}

const notifyCheckStateChange = (pr: NotificationPR) => {
  const { title, body } = formatCheckStateNotification(pr, pr.checkState!)
  fireNotification(title, body, () => handleSinglePRClick(pr))
}

const notifyReviewLeft = (pr: NotificationPR, review: Review) => {
  if (!review.author || !isNotifiableReviewState(review.state)) return
  const { title, body } = formatReviewNotification(pr, review.author.login, review.state)
  fireNotification(title, body, () => handleSinglePRClick(pr))
}

// shared by both the new-PR diff (group a) and the check-state diff (group b) — each section can
// be polled for either or both independently, so the fetch+filter step is the only thing in common
const fetchSection = async (section: NotificationSection): Promise<NotificationPR[] | null> => {
  if (!viewerLogin) return null
  try {
    const res = await graphql<{ data: { search: { nodes: RawSearchNode[] } } }>(SEARCH_QUERY, {
      searchQuery: buildSearchQuery(section, viewerLogin),
    })
    const nodes = res.data.search.nodes.map(toNotificationPR)
    return filterDrafts(
      filterSelectedRepos(
        filterMuted(nodes, state.settings.hiddenAuthors, state.settings.hiddenRepos),
        state.settings.selectedReposByCategory[section]
      ),
      state.settings.showDraftsByCategory[section]
    )
  } catch {
    return null
  }
}

const checkNewPRs = async (category: NotificationCategory) => {
  const nodes = await fetchSection(category)
  if (!nodes) return

  const fetchedIds = nodes.map((n) => n.id)
  const seenIds = state.seenIds[category]
  state.seenIds[category] = fetchedIds
  saveState()

  // First run for this category: seed seenIds, don't fire a notification storm.
  if (seenIds === undefined) return

  const newIds = diffNewIds(fetchedIds, seenIds)
  if (newIds.length === 0) return
  notifyNewPRs(
    category,
    nodes.filter((n) => newIds.includes(n.id))
  )
}

// self-pruning like seenIds: nextMap only keeps ids still open, so closed/merged PRs drop out
const checkChecks = async (section: ChecksSection) => {
  const nodes = await fetchSection(section)
  if (!nodes) return

  const prevMap = state.lastCheckState[section] ?? {}
  const nextMap: Record<string, CheckRollupState | null> = {}
  for (const pr of nodes) {
    const prevState = prevMap[pr.id]
    nextMap[pr.id] = pr.checkState
    // seed only on first sight of this PR — otherwise every already-green PR would notify once
    if (
      prevState !== undefined &&
      pr.checkState !== prevState &&
      isTerminalCheckState(pr.checkState)
    )
      notifyCheckStateChange(pr)
  }
  state.lastCheckState[section] = nextMap
  saveState()
}

// self-pruning like lastCheckState/seenIds: nextMap only keeps ids for PRs still open
const checkReviews = async () => {
  const nodes = await fetchSection('authored')
  if (!nodes) return

  const prevMap = state.seenReviewIds
  const nextMap: Record<string, string[]> = {}
  for (const pr of nodes) {
    const reviewIds = pr.reviews.map((r) => r.id)
    nextMap[pr.id] = reviewIds
    const prevIds = prevMap[pr.id]
    // seed only on first sight of this PR — otherwise every existing review would notify once
    if (prevIds === undefined) continue
    const newIds = diffNewIds(reviewIds, prevIds)
    for (const review of pr.reviews.filter((r) => newIds.includes(r.id))) {
      if (review.author?.login !== viewerLogin) notifyReviewLeft(pr, review)
    }
  }
  state.seenReviewIds = nextMap
  saveState()
}

const tick = async () => {
  const login = await ensureViewerLogin()
  if (!login) return
  for (const category of state.settings.enabledCategories) {
    await checkNewPRs(category)
  }
  if (state.settings.checksEnabled.assigned) await checkChecks('assigned')
  if (state.settings.checksEnabled.authored) await checkChecks('authored')
  if (state.settings.reviewLeftEnabled) await checkReviews()
}

const startPolling = () => {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(tick, state.settings.pollIntervalMs)
}

export const initNotifications = () => {
  state = loadState()
  startPolling()

  ipcMain.handle('notifications:updateSettings', (_e, partial: Partial<NotificationSettings>) => {
    state.settings = { ...state.settings, ...partial }
    saveState()
    startPolling()
  })
}
