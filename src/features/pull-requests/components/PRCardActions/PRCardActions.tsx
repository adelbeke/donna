import { ExternalLink, Eye, EyeOff, Link2, Star } from 'lucide-react'
import {
  OPACITY_CLASSNAME,
  PRCardAction,
} from '@/features/pull-requests/components/PRCardActions/PRCardAction.tsx'
import { CopyWithFeedback } from '@/shared/components/CopyWithFeedback/CopyWithFeedback.tsx'

type Props = {
  toggleHide: () => void
  isHidden: boolean
  togglePriority: () => void
  isPriority: boolean
  prUrl: string
}

export const PRCardActions = ({ isHidden, isPriority, prUrl, toggleHide, togglePriority }: Props) => {
  return (
    <div className="flex items-center gap-1 shrink-0 flex-col lg:flex-row">
      <PRCardAction
        onClick={toggleHide}
        title={isHidden ? 'Unhide PR' : 'Hide PR'}
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
      <CopyWithFeedback
        text={prUrl}
        label="Copy PR link"
        icon={<Link2 size={14} />}
        buttonClassName={`p-1.5 rounded text-[var(--color-text-muted)] ${OPACITY_CLASSNAME} hover:text-[var(--color-accent)] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none`}
      />
      <a
        href={prUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`p-1.5 rounded text-[var(--color-text-muted)] ${OPACITY_CLASSNAME} hover:text-[var(--color-accent)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none`}
      >
        <ExternalLink size={14} />
      </a>
    </div>
  )
}
