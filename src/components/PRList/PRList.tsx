import { RefreshCw } from 'lucide-react'
import { usePullRequests } from '../../hooks/useGitHubPRs'
import { usePRStore } from '../../store/prStore'
import PRCard from '../PRCard/PRCard'

const sectionLabels: Record<string, string> = {
  'review-requested': 'Review requested',
  authored: 'My pull requests',
  mentioned: 'Mentioned',
}

export default function PRList() {
  const { data: prs = [], priorityPRs = [], isLoading, isFetching, refetch, error, totalCount, loadedCount, truncated } = usePullRequests()
  const section = usePRStore((s) => s.filters.section)
  const isPaging = isFetching && !isLoading

  return (
    <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {sectionLabels[section]}
          </h2>
          {!isLoading && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)]">
              {prs.length + priorityPRs.length}
              {totalCount > prs.length + priorityPRs.length && (
                <span className="text-[var(--color-text-muted)]"> of {totalCount}</span>
              )}
            </span>
          )}
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh"
          className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* States */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-subtle)] p-4 text-sm text-[var(--color-danger)]">
          Failed to load pull requests. Check your token and network.
        </div>
      )}

      {isPaging && (
        <div className="text-xs text-[var(--color-text-muted)] mb-3">
          Loading {loadedCount} of {totalCount}…
        </div>
      )}

      {truncated && !isFetching && (
        <div className="text-xs text-[var(--color-text-muted)] mb-3 px-3 py-2 rounded bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          Showing first 1000 PRs — refine filters on GitHub to narrow results.
        </div>
      )}

      {!isLoading && !error && prs.length === 0 && priorityPRs.length === 0 && (
        <div className="text-center py-16 text-[var(--color-text-muted)]">
          <p className="text-sm">No pull requests found.</p>
          <p className="text-xs mt-1">Try adjusting your filters.</p>
          <p className="text-xs mt-3 text-[var(--color-text-muted)]">
            Missing PRs from an organization?{' '}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline"
            >
              Authorize your token for SSO →
            </a>
          </p>
        </div>
      )}

      {!isLoading && !error && priorityPRs.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Top priority</p>
          <div className="space-y-2">
            {priorityPRs.map((pr) => (
              <PRCard key={pr.id} pr={pr} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && prs.length > 0 && (
        <div className="space-y-2">
          {prs.map((pr) => (
            <PRCard key={pr.id} pr={pr} />
          ))}
        </div>
      )}
    </div>
  )
}
