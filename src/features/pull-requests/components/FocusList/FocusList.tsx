import { useQueryClient } from '@tanstack/react-query'
import { GitMerge, Eye, MessageSquareReply, type LucideIcon } from 'lucide-react'
import { useFocusPRs } from '../../queries/useFocusPRs'
import { PRCard } from '../PRCard/PRCard'
import { PRListHeader } from '@/features/pull-requests/components/PRListHeader/PRListHeader.tsx'
import { FOCUS_BUCKET_ORDER, type FocusBucket } from '../../lib/focus'

const BUCKET_META: Record<FocusBucket, { label: string; hint: string; icon: LucideIcon }> = {
  'ready-to-merge': {
    label: 'Ready to merge',
    hint: 'Yours, green, approved, no conflicts',
    icon: GitMerge,
  },
  'to-review': {
    label: 'Waiting for your review',
    hint: 'Review requested, not reviewed yet',
    icon: Eye,
  },
  'awaiting-my-reply': {
    label: 'Ball in your court',
    hint: 'Someone replied after you last spoke',
    icon: MessageSquareReply,
  },
}

export const FocusList = () => {
  const { buckets, total, isLoading, isFetching, isFetchingNextPage, error, refetch } =
    useFocusPRs()
  const queryClient = useQueryClient()

  const refetchAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['pr-details-batch'] })
    void queryClient.invalidateQueries({ queryKey: ['pr-details'] })
    void queryClient.invalidateQueries({ queryKey: ['pr-checks'] })
    void refetch()
  }

  return (
    <div className="flex-1 min-w-0">
      <PRListHeader
        title="Focus"
        displayCounter={!isLoading}
        counter={total}
        totalCount={total}
        displayTotalCount={false}
        refetch={refetchAll}
        isFetching={isFetching}
        isLoadingMore={isFetchingNextPage}
        hiddenCount={0}
      />

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
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

      {!isLoading && !error && total === 0 && (
        <div className="text-center py-16 text-[var(--color-text-muted)]">
          <p className="text-sm">Nothing needs you right now.</p>
          <p className="text-xs mt-1">
            No PRs ready to merge, awaiting your review, or waiting on your reply.
          </p>
        </div>
      )}

      {!isLoading && !error && total > 0 && (
        <div className="space-y-6">
          {FOCUS_BUCKET_ORDER.filter((bucket) => buckets[bucket].length > 0).map((bucket) => {
            const { label, hint, icon: Icon } = BUCKET_META[bucket]
            return (
              <section key={bucket}>
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
                    <Icon size={13} className="text-[var(--color-text-muted)]" />
                    {label}
                  </h3>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)]">
                    {buckets[bucket].length}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">{hint}</span>
                </div>
                <div className="space-y-2">
                  {buckets[bucket].map((pr) => (
                    <PRCard
                      key={pr.id}
                      pr={pr}
                      isAuthored={bucket === 'ready-to-merge'}
                      showHideAndStar
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
