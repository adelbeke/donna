import { Check, MessageSquare, X } from 'lucide-react'
import { timeAgo } from '@/features/pull-requests/lib/timeAgo'
import { CommentBody } from '../CommentBody/CommentBody'
import type { PRReview, PRReviewState } from '../../types'

type Props = { reviews: PRReview[] }

const STATE_ICON: Record<PRReviewState, typeof Check> = {
  APPROVED: Check,
  CHANGES_REQUESTED: X,
  COMMENTED: MessageSquare,
  DISMISSED: MessageSquare,
  PENDING: MessageSquare,
}

const STATE_LABEL: Record<PRReviewState, string> = {
  APPROVED: 'approved',
  CHANGES_REQUESTED: 'requested changes',
  COMMENTED: 'commented',
  DISMISSED: 'review dismissed',
  PENDING: 'commented',
}

const STATE_COLOR: Record<PRReviewState, string> = {
  APPROVED: 'text-[var(--color-success)]',
  CHANGES_REQUESTED: 'text-[var(--color-danger)]',
  COMMENTED: 'text-[var(--color-text-muted)]',
  DISMISSED: 'text-[var(--color-text-muted)]',
  PENDING: 'text-[var(--color-text-muted)]',
}

export const ReviewFeed = ({ reviews }: Props) => {
  if (reviews.length === 0) return null

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] divide-y divide-[var(--color-border)] px-3">
      {reviews.map((review) => {
        const Icon = STATE_ICON[review.state]
        return (
          <div key={review.id} className="flex items-start gap-2 py-2">
            {review.author && (
              <img
                src={review.author.avatarUrl}
                alt={review.author.login}
                className="w-5 h-5 rounded-full mt-0.5 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-medium text-[var(--color-text-primary)]">
                  {review.author?.login ?? 'unknown'}
                </span>
                <Icon size={12} className={STATE_COLOR[review.state]} />
                <span className={`text-xs ${STATE_COLOR[review.state]}`}>
                  {STATE_LABEL[review.state]}
                </span>
                {review.submittedAt && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {timeAgo(review.submittedAt)}
                  </span>
                )}
              </div>
              {review.body.trim() && <CommentBody body={review.body} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}
