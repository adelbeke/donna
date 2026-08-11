import { timeAgo } from '@/features/pull-requests/lib/timeAgo'
import { CommentBody } from '../CommentBody/CommentBody'
import type { PRReviewComment } from '../../types'

type Props = { comment: PRReviewComment }

export const DiffComment = ({ comment }: Props) => (
  <div className="flex items-start gap-2 py-2">
    {comment.author && (
      <img
        src={comment.author.avatarUrl}
        alt={comment.author.login}
        className="w-5 h-5 rounded-full mt-0.5 shrink-0"
      />
    )}
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-xs font-medium text-[var(--color-text-primary)]">
          {comment.author?.login ?? 'unknown'}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{timeAgo(comment.createdAt)}</span>
      </div>
      <CommentBody body={comment.body} />
    </div>
  </div>
)
