export type NotificationCategory = 'review-requested' | 'assigned' | 'reviewed'

export type NewPRNode = {
  number: number
  title: string
  author: { login: string } | null
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

export const buildSearchQuery = (category: NotificationCategory, login: string): string => {
  const base = 'is:open is:pr archived:false sort:updated-desc'
  switch (category) {
    case 'review-requested':
      return `${base} review-requested:${login}`
    case 'assigned':
      return `${base} assignee:${login} -author:${login}`
    case 'reviewed':
      return `${base} reviewed-by:${login} -author:${login}`
  }
}

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
