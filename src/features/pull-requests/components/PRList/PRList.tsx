import { useQueryClient } from '@tanstack/react-query'
import { usePullRequests } from '../../queries/useGitHubPRs'
import { usePRStore } from '../../stores/prStore'
import { PRCard } from '../PRCard/PRCard'
import { PRListHeader } from '@/features/pull-requests/components/PRListHeader/PRListHeader.tsx'
import { useFocusRefresh } from '../../hooks/useFocusRefresh'
import { NewPRsBadge } from '../NewPRsBadge/NewPRsBadge'
import { NotificationHint } from '../NotificationHint/NotificationHint'
import { ContextSwitchWarningBanner } from '../ContextSwitchWarningBanner/ContextSwitchWarningBanner'
import { isOverContextSwitchThreshold } from '../../lib/prUtils'

const sectionLabels: Record<string, string> = {
  'review-requested': 'Review requested',
  authored: 'My pull requests',
  mentioned: 'Mentioned',
}

export const PRList = () => {
  const {
    data: prs = [],
    priorityPRs = [],
    allPRs = [],
    isLoading,
    isFetching,
    isFetchingNextPage,
    refetch,
    error,
    totalCount,
  } = usePullRequests()
  const section = usePRStore((s) => s.section)
  const globalFilters = usePRStore((s) => s.globalFilters)
  const viewFilters = usePRStore((s) => s.viewFilters)
  const notificationHintDismissed = usePRStore((s) => s.notificationHintDismissed)
  const dismissNotificationHint = usePRStore((s) => s.dismissNotificationHint)
  const contextSwitchThreshold = usePRStore((s) => s.contextSwitchThreshold)
  const queryClient = useQueryClient()

  // Checks/details are fetched per-PR (usePRDetails/useCheckContexts) and won't
  // pick up window-focus refreshes on their own since refetchOnWindowFocus is
  // disabled globally — invalidate them alongside the PR list refetch.
  const refetchAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['pr-details'] })
    void queryClient.invalidateQueries({ queryKey: ['pr-checks'] })
    void refetch()
  }

  const { displayedPRs, displayedPriorityPRs, newCount, dismiss } = useFocusRefresh({
    allPRs,
    prs,
    priorityPRs,
    refetch: refetchAll,
    isFetching,
    isFetchingNextPage,
    globalFilters,
    view: viewFilters[section],
    section,
  })

  const handleRefetch = () => {
    dismiss()
    refetchAll()
  }

  return (
    <div className="flex-1 min-w-0">
      <PRListHeader
        title={sectionLabels[section]}
        displayCounter={!isLoading}
        counter={displayedPRs.length + displayedPriorityPRs.length}
        totalCount={totalCount}
        displayTotalCount={totalCount > displayedPRs.length + displayedPriorityPRs.length}
        refetch={handleRefetch}
        isFetching={isFetching}
        isLoadingMore={isFetchingNextPage}
      />

      {section === 'authored' &&
        isOverContextSwitchThreshold(allPRs.length, contextSwitchThreshold) && (
          <ContextSwitchWarningBanner count={allPRs.length} threshold={contextSwitchThreshold} />
        )}

      {newCount > 0 && <NewPRsBadge count={newCount} onDismiss={dismiss} />}

      {!notificationHintDismissed && <NotificationHint onDismiss={dismissNotificationHint} />}

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

      {!isLoading && !error && displayedPRs.length === 0 && displayedPriorityPRs.length === 0 && (
        <div className="text-center py-16 text-[var(--color-text-muted)]">
          <p className="text-sm">No pull requests found.</p>
          <p className="text-xs mt-1">Try adjusting your filters.</p>
        </div>
      )}

      {!isLoading && !error && displayedPriorityPRs.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            Top priority
          </p>
          <div className="space-y-2">
            {displayedPriorityPRs.map((pr) => (
              <PRCard
                key={pr.id}
                pr={pr}
                isAuthored={section === 'authored'}
                showHideAndStar={section === 'review-requested'}
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && displayedPRs.length > 0 && (
        <div className="space-y-2">
          {displayedPRs.map((pr) => (
            <PRCard
              key={pr.id}
              pr={pr}
              isAuthored={section === 'authored'}
              showHideAndStar={section === 'review-requested'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
