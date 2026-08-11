import { DiffComment } from '../DiffComment/DiffComment'
import type { PRReviewThread } from '../../types'

type Props = { threads: PRReviewThread[] }

export const OutdatedThreadsPanel = ({ threads }: Props) => {
  if (threads.length === 0) return null

  return (
    <details className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
      <summary className="cursor-pointer px-3 py-2 text-xs text-[var(--color-text-muted)]">
        {threads.length} outdated comment{threads.length === 1 ? '' : 's'}
      </summary>
      <div className="divide-y divide-[var(--color-border)] px-3">
        {threads.map((thread) => (
          <div key={thread.id} className="py-2">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">{thread.path}</p>
            {thread.comments.nodes.map((comment) => (
              <DiffComment key={comment.id} comment={comment} />
            ))}
          </div>
        ))}
      </div>
    </details>
  )
}
