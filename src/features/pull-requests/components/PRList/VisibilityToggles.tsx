import { usePRStore } from '@/features/pull-requests/stores/prStore'

export function VisibilityToggles() {
  const { filters, setFilters } = usePRStore()
  const hiddenIds = usePRStore((s) => s.hiddenIds)

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setFilters({ showDrafts: !filters.showDrafts })}
        title={filters.showDrafts ? 'Hide drafts' : 'Show drafts'}
        className={`text-xs px-2 py-0.5 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
          ${
            filters.showDrafts
              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
          }`}
      >
        Drafts
      </button>
      <button
        onClick={() => setFilters({ showHidden: !filters.showHidden })}
        title={filters.showHidden ? 'Hide hidden PRs' : 'Show hidden PRs'}
        className={`text-xs px-2 py-0.5 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
          ${
            filters.showHidden
              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
          }`}
      >
        Hidden{hiddenIds.length > 0 && ` (${hiddenIds.length})`}
      </button>
    </div>
  )
}
