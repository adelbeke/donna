import type { PullRequest } from '@/types/github'
import {
  deriveCheckState,
  deriveMyReviewState,
  deriveReviewerSummary,
  sortAndPartition,
} from './prUtils'

export type FocusBucket = 'ready-to-merge' | 'to-review' | 'awaiting-my-reply'

// Cheapest-to-clear first: a green approved PR is one click, a review is minutes,
// an unanswered thread is an open-ended conversation.
export const FOCUS_BUCKET_ORDER: FocusBucket[] = [
  'ready-to-merge',
  'to-review',
  'awaiting-my-reply',
]

type Activity = { at: number; login: string }

// ponytail: inline review-thread replies are not exposed as a separate connection — GitHub wraps
// each one in an auto-created PullRequestReview (state COMMENTED, submittedAt = the reply time).
// So `reviews` + `comments` together already cover every way a human speaks on a PR, and we never
// need the far heavier `reviewThreads` traversal just to know who spoke last.
const activityLog = (pr: PullRequest): Activity[] => {
  const entries: Activity[] = []

  for (const review of pr.reviews?.nodes ?? []) {
    if (!review.author || !review.submittedAt) continue
    entries.push({ at: new Date(review.submittedAt).getTime(), login: review.author.login })
  }

  for (const comment of pr.comments?.nodes ?? []) {
    if (!comment.author || !comment.createdAt) continue
    entries.push({ at: new Date(comment.createdAt).getTime(), login: comment.author.login })
  }

  return entries.filter((entry) => Number.isFinite(entry.at))
}

const latestAt = (entries: Activity[]): number | null =>
  entries.length ? Math.max(...entries.map((entry) => entry.at)) : null

export const isAwaitingMyReply = (pr: PullRequest, login: string): boolean => {
  if (!login) return false

  const log = activityLog(pr)
  const iAmAuthor = pr.author?.login === login
  const mine = log.filter((entry) => entry.login === login)

  // Someone else's conversation: if I never spoke and it isn't my PR, it isn't my reply to make.
  if (!iAmAuthor && mine.length === 0) return false

  const theirsAt = latestAt(log.filter((entry) => entry.login !== login))
  if (theirsAt === null) return false

  // Opening a PR counts as my first word, so activity must post-date it to need an answer.
  const mineAt = latestAt(mine) ?? (iAmAuthor ? new Date(pr.createdAt).getTime() : null)
  if (mineAt === null) return false

  return theirsAt > mineAt
}

export const isReadyToMerge = (pr: PullRequest, login: string): boolean => {
  if (!login || pr.author?.login !== login) return false
  if (pr.isDraft) return false
  // Also guards the checks test below: until details load `mergeable` is undefined, so a PR is
  // never called ready off the back of a not-yet-fetched (null) check rollup.
  if (pr.mergeable !== 'MERGEABLE') return false

  const checkState = deriveCheckState(pr)
  if (checkState !== null && checkState !== 'SUCCESS') return false

  const { approved, changesRequested } = deriveReviewerSummary(pr, login)
  return approved.length > 0 && changesRequested.length === 0
}

export const classifyPR = (
  pr: PullRequest,
  login: string,
  isReviewRequested: boolean
): FocusBucket | null => {
  if (isReadyToMerge(pr, login)) return 'ready-to-merge'

  // `reviewRequests` only lists *pending* requests and never names me behind a team request, so
  // membership of the review-requested search is the reliable signal here.
  const awaitsMyReview =
    isReviewRequested &&
    !pr.isDraft &&
    pr.author?.login !== login &&
    deriveMyReviewState(pr, login) === null
  if (awaitsMyReview) return 'to-review'

  if (isAwaitingMyReply(pr, login)) return 'awaiting-my-reply'

  return null
}

export const groupIntoBuckets = (
  prs: PullRequest[],
  login: string,
  reviewRequestedIds: Set<string>,
  priorityIds: string[]
): Record<FocusBucket, PullRequest[]> => {
  const buckets: Record<FocusBucket, PullRequest[]> = {
    'ready-to-merge': [],
    'to-review': [],
    'awaiting-my-reply': [],
  }

  for (const pr of prs) {
    const bucket = classifyPR(pr, login, reviewRequestedIds.has(pr.id))
    if (bucket) buckets[bucket].push(pr)
  }

  for (const bucket of FOCUS_BUCKET_ORDER) {
    const { priorityPRs, regular } = sortAndPartition(buckets[bucket], priorityIds)
    buckets[bucket] = [...priorityPRs, ...regular]
  }

  return buckets
}
