import { usePRStore } from '@/features/pull-requests/stores/prStore.ts'

export function VisibilityToggles() {
  const section = usePRStore((s) => s.section)
  const globalFilters = usePRStore((s) => s.globalFilters)
  const setGlobalFilters = usePRStore((s) => s.setGlobalFilters)
  const viewFilters = usePRStore((s) => s.viewFilters)
  const setViewFilters = usePRStore((s) => s.setViewFilters)
  const hiddenIds = usePRStore((s) => s.hiddenIds)

  const showDrafts = viewFilters[section].showDrafts

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setViewFilters(section, { showDrafts: !showDrafts })}
        title={showDrafts ? 'Hide drafts' : 'Show drafts'}
        className={`text-xs px-2 py-0.5 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
          ${
            showDrafts
              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
          }`}
      >
        Drafts
      </button>
      <button
        onClick={() => setGlobalFilters({ showHidden: !globalFilters.showHidden })}
        title={globalFilters.showHidden ? 'Hide hidden PRs' : 'Show hidden PRs'}
        className={`text-xs px-2 py-0.5 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
          ${
            globalFilters.showHidden
              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
          }`}
      >
        Hidden{hiddenIds.length > 0 && ` (${hiddenIds.length})`}
      </button>
    </div>
  )
}
