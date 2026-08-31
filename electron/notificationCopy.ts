export type NotificationCategory = 'review-requested' | 'assigned' | 'reviewed'

// the per-PR-state-diff sections (checks) — 'authored' has no new-PR notification (group a),
// only check-state tracking, so it's not part of NotificationCategory
export type ChecksSection = 'authored' | 'assigned'
export type NotificationSection = NotificationCategory | 'authored'

export type CheckRollupState = 'SUCCESS' | 'FAILURE' | 'PENDING' | 'ERROR' | 'EXPECTED'

export type ReviewState = 'PENDING' | 'COMMENTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'DISMISSED'
type NotifiableReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED'

export type NewPRNode = {
  number: number
  title: string
  author: { login: string } | null
  repository: { nameWithOwner: string }
}

export type CheckedPRNode = {
  number: number
  title: string
  repository: { nameWithOwner: string }
}

// supports "owner/repo" (exact) or "owner" (org-wide) — mirrors prFilters.ts's isRepoMatchedBy
export const isRepoMatchedBy = (repoNameWithOwner: string, pattern: string): boolean => {
  const repo = repoNameWithOwner.toLowerCase()
  return pattern.includes('/') ? repo === pattern : repo.split('/')[0] === pattern
}

export const filterMuted = <T extends NewPRNode>(
  nodes: T[],
  hiddenAuthors: string[],
  hiddenRepos: string[]
): T[] =>
  nodes.filter((n) => {
    if (n.author && hiddenAuthors.some((a) => n.author!.login.toLowerCase() === a.toLowerCase()))
      return false
    if (hiddenRepos.some((r) => isRepoMatchedBy(n.repository.nameWithOwner, r))) return false
    return true
  })

export const filterDrafts = <T extends { isDraft: boolean }>(
  nodes: T[],
  showDrafts: boolean
): T[] => (showDrafts ? nodes : nodes.filter((n) => !n.isDraft))

export const filterSelectedRepos = <T extends NewPRNode>(nodes: T[], repos: string[]): T[] =>
  repos.length === 0 ? nodes : nodes.filter((n) => repos.includes(n.repository.nameWithOwner))

const SINGLE_TITLE: Record<NotificationCategory, string> = {
  'review-requested': 'New review request',
  assigned: 'You were assigned',
  reviewed: 'New PR to review',
}

const PLURAL_LABEL: Record<NotificationCategory, string> = {
  'review-requested': 'new review requests',
  assigned: 'new assignments',
  reviewed: 'new PRs to review',
}

const MAX_REPOS_IN_BODY = 3

export const buildSearchQuery = (section: NotificationSection, login: string): string => {
  const base = 'is:open is:pr archived:false sort:updated-desc'
  switch (section) {
    case 'review-requested':
      return `${base} review-requested:${login}`
    case 'assigned':
      return `${base} assignee:${login} -author:${login}`
    case 'reviewed':
      return `${base} reviewed-by:${login} -author:${login}`
    case 'authored':
      return `${base} author:${login}`
  }
}

// terminal = worth notifying about; PENDING/EXPECTED are still in flight
export const isTerminalCheckState = (state: CheckRollupState | null): boolean =>
  state === 'SUCCESS' || state === 'FAILURE'

export const formatCheckStateNotification = (
  pr: CheckedPRNode,
  checkState: CheckRollupState
): { title: string; body: string } => ({
  title: checkState === 'FAILURE' ? 'CI failed' : 'CI passed',
  body: `${pr.repository.nameWithOwner}#${pr.number} · ${pr.title}`,
})

export const isNotifiableReviewState = (state: ReviewState): state is NotifiableReviewState =>
  state === 'APPROVED' || state === 'CHANGES_REQUESTED' || state === 'COMMENTED'

const REVIEW_VERB: Record<NotifiableReviewState, string> = {
  APPROVED: 'approved',
  CHANGES_REQUESTED: 'requested changes on',
  COMMENTED: 'commented on',
}

export const formatReviewNotification = (
  pr: CheckedPRNode,
  reviewerLogin: string,
  state: NotifiableReviewState
): { title: string; body: string } => ({
  title: `${reviewerLogin} ${REVIEW_VERB[state]} your PR`,
  body: `${pr.repository.nameWithOwner}#${pr.number} · ${pr.title}`,
})

export const diffNewIds = (fetchedIds: string[], seenIds: string[]): string[] => {
  const seen = new Set(seenIds)
  return fetchedIds.filter((id) => !seen.has(id))
}

export const formatNewPRNotification = (
  category: NotificationCategory,
  nodes: NewPRNode[]
): { title: string; body: string } => {
  if (nodes.length === 1) {
    const pr = nodes[0]
    return {
      title: SINGLE_TITLE[category],
      body: `${pr.repository.nameWithOwner}#${pr.number} · ${pr.title} — by ${pr.author?.login ?? 'unknown'}`,
    }
  }

  const repoNames = [...new Set(nodes.map((n) => n.repository.nameWithOwner.split('/')[1]))]
  const shown = repoNames.slice(0, MAX_REPOS_IN_BODY)
  const rest = repoNames.length - shown.length
  return {
    title: `${nodes.length} ${PLURAL_LABEL[category]}`,
    body: rest > 0 ? `${shown.join(', ')} and ${rest} more` : shown.join(', '),
  }
}
