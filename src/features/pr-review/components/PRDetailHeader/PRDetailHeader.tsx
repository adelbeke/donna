import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import type { PRDetailMeta } from '../../types'

type Props = { pr: PRDetailMeta }

export const PRDetailHeader = ({ pr }: Props) => (
  <div className="mb-4">
    <Link
      to="/prs"
      className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-3"
    >
      <ArrowLeft size={14} />
      Back to pull requests
    </Link>

    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-[var(--color-text-muted)] mb-1">{pr.repository.nameWithOwner}</p>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)] leading-snug">
          {pr.title}{' '}
          <span className="text-[var(--color-text-muted)] font-normal">#{pr.number}</span>
        </h1>
        <div className="flex items-center flex-wrap gap-2 mt-2 text-xs text-[var(--color-text-secondary)]">
          {pr.author && (
            <span className="flex items-center gap-1.5">
              <img
                src={pr.author.avatarUrl}
                alt={pr.author.login}
                className="w-4 h-4 rounded-full"
              />
              {pr.author.login}
            </span>
          )}
          <span className="font-mono">
            {pr.baseRefName} ← {pr.headRefName}
          </span>
          <span className="font-mono">
            <span className="text-[var(--color-success)]">+{pr.additions}</span>{' '}
            <span className="text-[var(--color-danger)]">-{pr.deletions}</span>
          </span>
          {pr.isDraft && (
            <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)]">
              Draft
            </span>
          )}
        </div>
      </div>

      <a
        href={pr.url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-1 text-xs px-2 py-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-overlay)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
      >
        <ExternalLink size={14} />
        Open on GitHub
      </a>
    </div>
  </div>
)
