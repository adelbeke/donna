import { Search, X } from 'lucide-react'
import { usePRStore, type PRSection } from '../../store/prStore'
import type { ReviewState } from '../../types/github'
import { usePullRequests } from '../../hooks/useGitHubPRs'

const SECTIONS: { id: PRSection; label: string }[] = [
  { id: 'review-requested', label: 'Review requested' },
  { id: 'authored', label: 'My PRs' },
  { id: 'mentioned', label: 'Mentioned' },
]

const REVIEW_STATES: { id: ReviewState; label: string }[] = [
  { id: 'CHANGES_REQUESTED', label: 'Changes requested' },
  { id: 'COMMENTED', label: 'Commented' },
  { id: 'PENDING', label: 'Not reviewed' },
]

export default function Filters() {
  const { filters, setFilters, resetFilters } = usePRStore()
  const hiddenIds = usePRStore((s) => s.hiddenIds)
  const { repos = [] } = usePullRequests()

  const hasActiveFilters =
    filters.repos.length > 0 ||
    filters.reviewStates.length > 0 ||
    filters.showDrafts ||
    filters.search.length > 0

  function toggleRepo(repo: string) {
    setFilters({
      repos: filters.repos.includes(repo)
        ? filters.repos.filter((r) => r !== repo)
        : [...filters.repos, repo],
    })
  }

  function toggleReviewState(state: ReviewState) {
    setFilters({
      reviewStates: filters.reviewStates.includes(state)
        ? filters.reviewStates.filter((s) => s !== state)
        : [...filters.reviewStates, state],
    })
  }

  return (
    <aside className="w-56 shrink-0 space-y-6">
      {/* Section tabs */}
      <nav className="space-y-0.5">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilters({ section: s.id })}
            className={`w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
              ${
                filters.section === s.id
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]'
              }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-[var(--color-border-subtle)]" />

      {/* Sort */}
      <div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Sort
        </p>
        <select
          value={filters.sortOrder}
          onChange={(e) => setFilters({ sortOrder: e.target.value as 'newest' | 'oldest' })}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors cursor-pointer"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {/* Search */}
      <div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Search
        </p>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="Filter by title…"
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md pl-7 pr-3 py-1.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors"
          />
        </div>
      </div>

      {/* Review state filter */}
      <div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          My review
        </p>
        <div className="space-y-0.5">
          {REVIEW_STATES.map((state) => (
            <label
              key={state.id}
              className="flex items-center gap-2 px-1 py-1 rounded cursor-pointer hover:bg-[var(--color-surface-overlay)] group"
            >
              <input
                type="checkbox"
                checked={filters.reviewStates.includes(state.id)}
                onChange={() => toggleReviewState(state.id)}
                className="accent-[var(--color-accent)] cursor-pointer"
              />
              <span className="text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
                {state.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Repo filter — only shown if multiple repos */}
      {repos.length > 1 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Repository{filters.repos.length > 0 && ` (${filters.repos.length})`}
            </p>
            {filters.repos.length > 0 && (
              <button
                onClick={() => setFilters({ repos: [] })}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {repos.map((repo) => {
              const selected = filters.repos.includes(repo)
              return (
                <label
                  key={repo}
                  className={`flex items-center gap-2 px-1 py-1 rounded cursor-pointer group
                    ${selected
                      ? 'bg-[var(--color-accent-subtle)]'
                      : 'hover:bg-[var(--color-surface-overlay)]'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleRepo(repo)}
                    className="accent-[var(--color-accent)] cursor-pointer"
                  />
                  <span className={`text-xs truncate
                    ${selected
                      ? 'text-[var(--color-text-primary)] font-medium'
                      : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {repo.split('/')[1]}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Visibility toggles */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 px-1 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.showDrafts}
            onChange={(e) => setFilters({ showDrafts: e.target.checked })}
            className="accent-[var(--color-accent)] cursor-pointer"
          />
          <span className="text-xs text-[var(--color-text-secondary)]">Show drafts</span>
        </label>

        <label className="flex items-center gap-2 px-1 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.showHidden}
            onChange={(e) => setFilters({ showHidden: e.target.checked })}
            className="accent-[var(--color-accent)] cursor-pointer"
          />
          <span className="text-xs text-[var(--color-text-secondary)]">
            Show hidden
            {hiddenIds.length > 0 && (
              <span className="ml-1 text-[var(--color-text-muted)]">({hiddenIds.length})</span>
            )}
          </span>
        </label>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
        >
          <X size={12} />
          Reset filters
        </button>
      )}
    </aside>
  )
}
