import type { ReactElement } from 'react'
import { GitMerge, MessageSquare, Check, AlertCircle, Star, ExternalLink, FileCode, EyeOff, Eye } from 'lucide-react'
import type { PullRequest, ReviewState } from '../../types/github'
import { usePRStore } from '../../store/prStore'

interface Props {
  pr: PullRequest
}

const reviewBadge: Record<
  ReviewState,
  { label: string; color: string; bg: string; icon: ReactElement }
> = {
  APPROVED: {
    label: 'Approved',
    color: 'text-[var(--color-success)]',
    bg: 'bg-[var(--color-success-subtle)]',
    icon: <Check size={11} />,
  },
  CHANGES_REQUESTED: {
    label: 'Changes requested',
    color: 'text-[var(--color-danger)]',
    bg: 'bg-[var(--color-danger-subtle)]',
    icon: <AlertCircle size={11} />,
  },
  COMMENTED: {
    label: 'Commented',
    color: 'text-[var(--color-accent)]',
    bg: 'bg-[var(--color-accent-subtle)]',
    icon: <MessageSquare size={11} />,
  },
  PENDING: {
    label: 'Pending',
    color: 'text-[var(--color-text-secondary)]',
    bg: 'bg-[var(--color-surface-overlay)]',
    icon: <MessageSquare size={11} />,
  },
  DISMISSED: {
    label: 'Dismissed',
    color: 'text-[var(--color-text-muted)]',
    bg: 'bg-[var(--color-surface-overlay)]',
    icon: <MessageSquare size={11} />,
  },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default function PRCard({ pr }: Props) {
  const togglePriority = usePRStore((s) => s.togglePriority)
  const toggleHide = usePRStore((s) => s.toggleHide)
  const priorityIds = usePRStore((s) => s.priorityIds)
  const isPriority = priorityIds.includes(pr.id)
  const isHidden = pr.isHidden ?? false

  const badge = pr.myReviewState ? reviewBadge[pr.myReviewState] : null

  return (
    <div
      className={`
        group relative bg-[var(--color-surface-raised)] border rounded-lg p-4
        hover:border-[var(--color-accent)] hover:-translate-y-px
        shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]
        transition-all duration-150
        ${isHidden ? 'opacity-50' : ''}
        border-[var(--color-border)]
      `}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: icon + content */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 shrink-0">
            {pr.isDraft ? (
              <FileCode size={16} className="text-[var(--color-text-muted)]" />
            ) : (
              <GitMerge size={16} className="text-[var(--color-success)]" />
            )}
          </div>

          <div className="min-w-0">
            {/* Repo */}
            <p className="text-xs text-[var(--color-text-muted)] mb-0.5 truncate">
              {pr.repository.nameWithOwner}
            </p>

            {/* Title */}
            <a
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium leading-snug line-clamp-2 transition-colors text-[var(--color-text-primary)] hover:text-[var(--color-accent)]"
            >
              {pr.title}
            </a>

            {/* Meta row */}
            <div className="flex items-center flex-wrap gap-2 mt-2">
              {/* Author */}
              {pr.author && (
                <div className="flex items-center gap-1.5">
                  <img
                    src={pr.author.avatarUrl}
                    alt={pr.author.login}
                    className="w-4 h-4 rounded-full"
                  />
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {pr.author.login}
                  </span>
                </div>
              )}

              {/* Number + age */}
              <span className="text-xs text-[var(--color-text-muted)]">
                #{pr.number} · opened {timeAgo(pr.createdAt)} · updated {timeAgo(pr.updatedAt)}
              </span>

              {/* Diff size */}
              <span className="text-xs font-mono">
                <span className="text-[var(--color-success)]">+{pr.additions}</span>
                {' '}
                <span className="text-[var(--color-danger)]">-{pr.deletions}</span>
              </span>

              {/* Draft */}
              {pr.isDraft && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)]">
                  Draft
                </span>
              )}

              {/* Hidden badge */}
              {isHidden && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)]">
                  Hidden
                </span>
              )}

              {/* Review state badge */}
              {badge && (
                <span
                  className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${badge.color} ${badge.bg}`}
                >
                  {badge.icon}
                  {badge.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => toggleHide(pr.id)}
            title={isHidden ? 'Unhide PR' : 'Hide PR'}
            className={`p-1.5 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
              ${
                isHidden
                  ? 'text-[var(--color-warning)]'
                  : 'text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-warning)]'
              }`}
          >
            {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>

          <button
            onClick={() => togglePriority(pr.id)}
            title={isPriority ? 'Remove priority' : 'Mark as top priority'}
            className={`p-1.5 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
              ${
                isPriority
                  ? 'text-[var(--color-priority)]'
                  : 'text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-priority)]'
              }`}
          >
            <Star size={14} fill={isPriority ? 'currentColor' : 'none'} />
          </button>

          <a
            href={pr.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-accent)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
