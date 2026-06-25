import { useEffect, useRef } from 'react'
import { usePullRequests } from '../../queries/useGitHubPRs'
import { usePRStore } from '../../stores/prStore'
import { PRCard } from '../PRCard/PRCard'
import {PRListHeader} from "@/features/pull-requests/components/PRList/PRListHeader/PRListHeader.tsx";

const sectionLabels: Record<string, string> = {
  'review-requested': 'Review requested',
  authored: 'My pull requests',
  mentioned: 'Mentioned',
}

export function PRList() {
  const {
    data: prs = [],
    priorityPRs = [],
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    error,
    totalCount,
    truncated,
  } = usePullRequests()
  const filters = usePRStore((s) => s.filters)
  const section = filters.section
  const loadAllRef = useRef(false)

  const handleRefetch = () => void refetch()

  const hasActiveFilters =
    filters.repos.length > 0 ||
    (filters.hiddenAuthors?.length ?? 0) > 0 ||
    filters.showDrafts ||
    filters.search.length > 0

  useEffect(() => {
    if (loadAllRef.current && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
    if (!hasNextPage) {
      loadAllRef.current = false
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="flex-1 min-w-0">
      {/* Header */}
      <PRListHeader title={sectionLabels[section]} displayCounter={!isLoading} counter={prs.length + priorityPRs.length} totalCount={totalCount} displayTotalCount={totalCount > prs.length + priorityPRs.length} refetch={handleRefetch} isFetching={isFetching} />

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
          <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            Top priority
          </p>
          <div className="space-y-2">
            {priorityPRs.map((pr) => (
              <PRCard key={pr.id} pr={pr} isAuthored={section === 'authored'} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && prs.length > 0 && (
        <div className="space-y-2">
          {prs.map((pr) => (
            <PRCard key={pr.id} pr={pr} isAuthored={section === 'authored'} />
          ))}
        </div>
      )}

      {!isLoading && !error && hasNextPage && !truncated && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-xs px-3 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer disabled:opacity-40"
            >
              {isFetchingNextPage ? 'Loading…' : 'Load more'}
            </button>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  loadAllRef.current = true
                  fetchNextPage()
                }}
                disabled={isFetchingNextPage}
                className="text-xs px-3 py-1.5 rounded border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] transition-colors cursor-pointer disabled:opacity-40"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load all'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
