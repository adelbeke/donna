import { Eye, EyeOff, GitBranch, Link2, Star, Terminal } from 'lucide-react'
import { PRCardAction } from '@/features/pull-requests/components/PRCardActions/PRCardAction.tsx'
import { CopyWithFeedback } from '@/shared/components/CopyWithFeedback/CopyWithFeedback.tsx'

type Props = {
  toggleHide: () => void
  isHidden: boolean
  togglePriority: () => void
  isPriority: boolean
  prUrl: string
  prNumber: number
  showHideAndStar: boolean
  showRunShortcut: boolean
  onRunShortcut: () => void
}

export const PRCardActions = ({
  isHidden,
  isPriority,
  prUrl,
  prNumber,
  toggleHide,
  togglePriority,
  showHideAndStar,
  showRunShortcut,
  onRunShortcut,
}: Props) => {
  return (
    <div
      className="flex items-center gap-1 shrink-0 flex-col lg:flex-row"
      onClick={(e) => e.stopPropagation()}
    >
      {showHideAndStar && (
        <>
          <PRCardAction
            onClick={toggleHide}
            title={isHidden ? 'Unhide PR (Donna only)' : 'Hide PR (Donna only)'}
            className={
              isHidden
                ? 'text-[var(--color-warning)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-warning)]'
            }
          >
            {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
          </PRCardAction>
          <PRCardAction
            onClick={togglePriority}
            title={isPriority ? 'Remove priority' : 'Mark as top priority'}
            className={
              isPriority
                ? 'text-[var(--color-priority)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-priority)]'
            }
          >
            <Star size={14} fill={isPriority ? 'currentColor' : 'none'} />
          </PRCardAction>
        </>
      )}
      {showRunShortcut && (
        <PRCardAction
          onClick={onRunShortcut}
          title="Run shortcut"
          className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
        >
          <Terminal size={14} />
        </PRCardAction>
      )}
      <CopyWithFeedback
        text={prUrl}
        label="Copy PR link"
        icon={<Link2 size={14} />}
        buttonClassName="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
      />
      <CopyWithFeedback
        text={`gh pr checkout ${prNumber}`}
        label="Copy checkout command"
        icon={<GitBranch size={14} />}
        buttonClassName="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
      />
    </div>
  )
}
