import { useState } from 'react'
import { Lock, X } from 'lucide-react'
import { usePRStore, type PRSection } from '../../store/prStore'
import { usePullRequests } from '../../hooks/useGitHubPRs'
import { IS_ELECTRON } from '../../lib/electron'

const SECTIONS: { id: PRSection; label: string }[] = [
  { id: 'review-requested', label: 'Review requested' },
  { id: 'authored', label: 'My PRs' },
  { id: 'mentioned', label: 'Mentioned' },
]

export default function Filters() {
  const { filters, setFilters } = usePRStore()
  const addHiddenAuthor = usePRStore((s) => s.addHiddenAuthor)
  const removeHiddenAuthor = usePRStore((s) => s.removeHiddenAuthor)
  const { repos = [], hasNextPage, truncated, loadedCount, totalCount } = usePullRequests()
  const [mutedInput, setMutedInput] = useState('')

  function toggleRepo(repo: string) {
    setFilters({
      repos: filters.repos.includes(repo)
        ? filters.repos.filter((r) => r !== repo)
        : [...filters.repos, repo],
    })
  }

  function handleMutedKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const trimmed = mutedInput.trim()
      if (trimmed) {
        addHiddenAuthor(trimmed)
        setMutedInput('')
      }
    }
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
                    ${
                      selected
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
                  <span
                    className={`text-xs truncate
                    ${
                      selected
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

      {(filters.repos.length > 0 || filters.showDrafts || filters.showHidden) &&
        hasNextPage &&
        !truncated && (
          <p className="text-xs text-[var(--color-warning)]">
            ⚠ Filters apply to {loadedCount} of ~{totalCount} PRs
          </p>
        )}

      {/* Muted authors — free-form pattern input */}
      <div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Muted authors{filters.hiddenAuthors.length > 0 && ` (${filters.hiddenAuthors.length})`}
        </p>
        <input
          type="text"
          value={mutedInput}
          onChange={(e) => setMutedInput(e.target.value)}
          onKeyDown={handleMutedKeyDown}
          placeholder="e.g. renovate, dependabot"
          className="w-full text-xs px-2 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {filters.hiddenAuthors.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {filters.hiddenAuthors.map((pattern) => (
              <span
                key={pattern}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)]"
              >
                {pattern}
                <button
                  onClick={() => removeHiddenAuthor(pattern)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                  aria-label={`Remove ${pattern}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {!IS_ELECTRON && (
        <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-3 flex flex-col items-center gap-2 text-center cursor-default">
          <Lock size={16} className="text-[var(--color-text-muted)]" />
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Your GitHub token is never transmitted or shared. It only lives in your localStorage.
          </p>
        </div>
      )}
    </aside>
  )
}
