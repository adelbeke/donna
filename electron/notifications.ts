import { app, ipcMain, BrowserWindow, Notification, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { runGh } from './gh'
import { createWindow } from './main'
import {
  buildSearchQuery,
  diffNewIds,
  filterMuted,
  formatNewPRNotification,
} from './notificationCopy'
import type { NotificationCategory } from './notificationCopy'

export type { NotificationCategory }

export type NotificationSettings = {
  enabledCategories: NotificationCategory[]
  pollIntervalMs: number
  openPRsInDonna: boolean
  hiddenAuthors: string[]
  hiddenRepos: string[]
}

export type NotificationNavigatePayload = { route: string } | { section: NotificationCategory }

type NotificationPR = {
  id: string
  number: number
  title: string
  url: string
  author: { login: string } | null
  repository: { nameWithOwner: string }
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabledCategories: ['review-requested', 'assigned'],
  pollIntervalMs: 5 * 60_000,
  openPRsInDonna: true,
  hiddenAuthors: [],
  hiddenRepos: [],
}

type PersistedState = {
  settings: NotificationSettings
  seenIds: Partial<Record<NotificationCategory, string[]>>
}

const DEFAULT_STATE: PersistedState = { settings: DEFAULT_SETTINGS, seenIds: {} }

const storePath = () => path.join(app.getPath('userData'), 'notifications.json')

const loadState = (): PersistedState => {
  try {
    const raw = fs.readFileSync(storePath(), 'utf-8')
    const parsed = JSON.parse(raw)
    return {
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      seenIds: parsed.seenIds ?? {},
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
          author { login }
          repository { nameWithOwner }
        }
      }
    }
  }
`

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

const fireNotification = (title: string, body: string, onClick: () => void) => {
  const notification = new Notification({ title, body })
  // ponytail: UNUserNotificationCenter can silently refuse an unsigned dev-mode Electron
  // bundle (UNErrorDomain error 1) — this only surfaces the failure, packaging is the fix.
  notification.on('failed', (_e, error) => console.error('[notifications] failed', error))
  notification.on('click', () => {
    focusWindow()
    onClick()
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

const checkCategory = async (category: NotificationCategory) => {
  if (!viewerLogin) return
  let nodes: NotificationPR[]
  try {
    const res = await graphql<{ data: { search: { nodes: NotificationPR[] } } }>(SEARCH_QUERY, {
      searchQuery: buildSearchQuery(category, viewerLogin),
    })
    nodes = filterMuted(
      res.data.search.nodes,
      state.settings.hiddenAuthors,
      state.settings.hiddenRepos
    )
  } catch {
    return
  }

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

const tick = async () => {
  const login = await ensureViewerLogin()
  if (!login) return
  for (const category of state.settings.enabledCategories) {
    await checkCategory(category)
  }
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
