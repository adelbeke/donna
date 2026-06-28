import { VisibilityToggles } from '@/features/pull-requests/components/VisibilityToggles/VisibilityToggles.tsx'
import { RefreshCw, Loader2 } from 'lucide-react'

type Props = {
  title: string
  displayCounter: boolean
  counter: number
  totalCount: number
  displayTotalCount: boolean
  refetch: () => void
  isFetching: boolean
  isLoadingMore?: boolean
}

export const PRListHeader = ({
  title,
  displayCounter,
  counter,
  totalCount,
  displayTotalCount,
  refetch,
  isFetching,
  isLoadingMore,
}: Props) => {
  return (
    <div className="flex flex-wrap items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {displayCounter && (
          <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)]">
            {counter}
            {displayTotalCount && (
              <span className="text-[var(--color-text-muted)]"> of {totalCount}</span>
            )}
            {isLoadingMore && <Loader2 size={10} className="animate-spin text-[var(--color-text-muted)]" />}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <VisibilityToggles />
        <button
          onClick={refetch}
          disabled={isFetching}
          title="Refresh"
          className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  )
}
