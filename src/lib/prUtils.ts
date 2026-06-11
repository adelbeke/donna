import type { PullRequest, ReviewState } from '../types/github'

export function buildSearchQuery(section: string, login: string): string {
  const base = 'is:open is:pr archived:false'
  switch (section) {
    case 'review-requested':
      return `${base} review-requested:${login}`
    case 'authored':
      return `${base} author:${login}`
    case 'mentioned':
      return `${base} mentions:${login}`
    default:
      return `${base} review-requested:${login}`
  }
}

export function deriveMyReviewState(pr: PullRequest, login: string): ReviewState | null {
  const myReviews = pr.reviews.nodes.filter((r) => r.author?.login === login)
  if (!myReviews.length) return null
  const sorted = [...myReviews].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  )
  return sorted[0].state
}

export function sortAndPartition(
  prs: PullRequest[],
  priorityIds: string[],
): { regular: PullRequest[]; priorityPRs: PullRequest[] } {
  const byDate = [...prs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  return {
    priorityPRs: byDate.filter((pr) => priorityIds.includes(pr.id)),
    regular: byDate.filter((pr) => !priorityIds.includes(pr.id)),
  }
}
