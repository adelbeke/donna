import type { PullRequest, ReviewState, CheckRollupState } from '../types/github'

export interface Reviewer {
  login: string
  avatarUrl: string
}

export interface ReviewerSummary {
  approved: Reviewer[]
  changesRequested: Reviewer[]
  commented: Reviewer[]
  pending: Reviewer[]
}

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

export function deriveReviewerSummary(pr: PullRequest, authorLogin: string): ReviewerSummary {
  const sorted = [...pr.reviews.nodes]
    .filter((r) => r.author && r.author.login !== authorLogin)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

  const seen = new Set<string>()
  const buckets: ReviewerSummary = { approved: [], changesRequested: [], commented: [], pending: [] }

  for (const review of sorted) {
    if (!review.author || seen.has(review.author.login)) continue
    if (review.state === 'DISMISSED' || review.state === 'PENDING') continue
    seen.add(review.author.login)
    const reviewer: Reviewer = { login: review.author.login, avatarUrl: review.author.avatarUrl }
    if (review.state === 'APPROVED') buckets.approved.push(reviewer)
    else if (review.state === 'CHANGES_REQUESTED') buckets.changesRequested.push(reviewer)
    else buckets.commented.push(reviewer)
  }

  for (const rr of pr.reviewRequests.nodes) {
    if (rr.requestedReviewer.__typename !== 'User') continue
    const r = rr.requestedReviewer as { __typename: 'User'; login: string; avatarUrl: string }
    if (!seen.has(r.login)) {
      buckets.pending.push({ login: r.login, avatarUrl: r.avatarUrl })
    }
  }

  return buckets
}

export function deriveCheckState(pr: PullRequest): CheckRollupState | null {
  return pr.commits.nodes[0]?.commit?.statusCheckRollup?.state ?? null
}

export function sortAndPartition(
  prs: PullRequest[],
  priorityIds: string[],
): { regular: PullRequest[]; priorityPRs: PullRequest[] } {
  const byDate = [...prs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
  return {
    priorityPRs: byDate.filter((pr) => priorityIds.includes(pr.id)),
    regular: byDate.filter((pr) => !priorityIds.includes(pr.id)),
  }
}
