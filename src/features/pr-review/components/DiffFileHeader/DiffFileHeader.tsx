import { ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'
import { OutdatedThreadsPanel } from '../OutdatedThreadsPanel/OutdatedThreadsPanel'
import type { PRFile, PRReviewThread } from '../../types'

const STATUS_LABEL: Record<PRFile['status'], string> = {
  added: 'Added',
  removed: 'Removed',
  modified: 'Modified',
  renamed: 'Renamed',
  copied: 'Copied',
  changed: 'Changed',
  unchanged: 'Unchanged',
}

type Props = {
  file: PRFile
  isExpanded: boolean
  onToggle: () => void
  commentCount: number
  outdatedThreads: PRReviewThread[]
  fileLevelThreads: PRReviewThread[]
}

export const DiffFileHeader = ({
  file,
  isExpanded,
  onToggle,
  commentCount,
  outdatedThreads,
  fileLevelThreads,
}: Props) => (
  <div className="border-b border-[var(--color-border)]">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer hover:bg-[var(--color-surface-overlay)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
    >
      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      <span className="text-xs font-mono truncate flex-1">
        {file.previous_filename ? `${file.previous_filename} → ${file.filename}` : file.filename}
      </span>
      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)] shrink-0">
        {STATUS_LABEL[file.status]}
      </span>
      <span className="text-xs font-mono shrink-0">
        <span className="text-[var(--color-success)]">+{file.additions}</span>{' '}
        <span className="text-[var(--color-danger)]">-{file.deletions}</span>
      </span>
      {commentCount > 0 && (
        <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] shrink-0">
          <MessageSquare size={12} />
          {commentCount}
        </span>
      )}
    </button>
    {fileLevelThreads.length > 0 && (
      <div className="px-3 pb-2 space-y-2">
        {fileLevelThreads.map((thread) => (
          <p key={thread.id} className="text-xs text-[var(--color-text-secondary)]">
            {thread.comments.nodes[0]?.body}
          </p>
        ))}
      </div>
    )}
    {outdatedThreads.length > 0 && (
      <div className="px-3 pb-2">
        <OutdatedThreadsPanel threads={outdatedThreads} />
      </div>
    )}
  </div>
)
