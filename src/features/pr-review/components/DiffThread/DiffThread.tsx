import { Check, CheckCircle2 } from 'lucide-react'
import { DiffComment } from '../DiffComment/DiffComment'
import { CommentComposer } from '../CommentComposer/CommentComposer'
import type { PRReviewThread } from '../../types'

type Props = {
  thread: PRReviewThread
  onReply: (body: string) => void
  isReplyPending: boolean
  replyError?: string | null
  onToggleResolve: () => void
  isResolvePending: boolean
}

export const DiffThread = ({
  thread,
  onReply,
  isReplyPending,
  replyError,
  onToggleResolve,
  isResolvePending,
}: Props) => {
  const rangeLabel =
    thread.startLine != null && thread.line != null && thread.startLine !== thread.line
      ? `Lines ${thread.startLine}–${thread.line}`
      : null

  return (
    <div className="my-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
      <div className="flex items-center justify-between gap-2 px-2 pt-2">
        <div className="flex items-center gap-2">
          {rangeLabel && (
            <span className="text-xs text-[var(--color-text-muted)]">{rangeLabel}</span>
          )}
          {thread.isOutdated && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)]">
              Outdated
            </span>
          )}
          {thread.isResolved && (
            <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded text-[var(--color-success)] bg-[var(--color-success-subtle)]">
              <CheckCircle2 size={11} />
              Resolved
              {thread.resolvedBy && ` by ${thread.resolvedBy.login}`}
            </span>
          )}
        </div>
        {(thread.viewerCanResolve || thread.viewerCanUnresolve) && (
          <button
            onClick={onToggleResolve}
            disabled={isResolvePending}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer disabled:opacity-60"
          >
            <Check size={12} />
            {thread.isResolved ? 'Unresolve' : 'Resolve'}
          </button>
        )}
      </div>

      <div className="divide-y divide-[var(--color-border)] px-2">
        {thread.comments.nodes.map((comment) => (
          <DiffComment key={comment.id} comment={comment} />
        ))}
      </div>

      {thread.viewerCanReply && (
        <CommentComposer
          onSubmit={onReply}
          onCancel={() => {}}
          isPending={isReplyPending}
          error={replyError}
          placeholder="Reply"
          submitLabel="Reply"
        />
      )}
    </div>
  )
}
