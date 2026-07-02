import { useState } from 'react'
import { Settings, X } from 'lucide-react'
import { usePRStore } from '../../stores/prStore'
import { usePullRequests } from '../../queries/useGitHubPRs'
import { isRepoMatchedBy } from '../../lib/prFilters'
import { ButtonWithTooltip } from '@/shared/components/ui/ButtonWithTooltip'
import { Modal } from '@/shared/components/ui/Modal.tsx'

export const SettingsModal = () => {
  const [open, setOpen] = useState(false)
  const [mutedInput, setMutedInput] = useState('')
  const [hiddenRepoInput, setHiddenRepoInput] = useState('')

  const section = usePRStore((s) => s.section)
  const globalFilters = usePRStore((s) => s.globalFilters)
  const viewFilters = usePRStore((s) => s.viewFilters)
  const setViewFilters = usePRStore((s) => s.setViewFilters)
  const addHiddenAuthor = usePRStore((s) => s.addHiddenAuthor)
  const removeHiddenAuthor = usePRStore((s) => s.removeHiddenAuthor)
  const addHiddenRepo = usePRStore((s) => s.addHiddenRepo)
  const removeHiddenRepo = usePRStore((s) => s.removeHiddenRepo)
  const { repos = [] } = usePullRequests()

  const currentView = viewFilters[section]
  const hasContent = repos.length > 1 || section !== 'authored'
  const visibleRepos = repos.filter(
    (r) => !globalFilters.hiddenRepos.some((h) => isRepoMatchedBy(r, h))
  )
  const orgs = [...new Set(visibleRepos.map((r) => r.split('/')[0]))]

  const activeCount =
    currentView.repos.length +
    (section !== 'authored'
      ? globalFilters.hiddenAuthors.length + globalFilters.hiddenRepos.length
      : 0)

  const toggleRepo = (repo: string) => {
    setViewFilters(section, {
      repos: currentView.repos.includes(repo)
        ? currentView.repos.filter((r) => r !== repo)
        : [...currentView.repos, repo],
    })
  }

  const toggleOrg = (org: string) => {
    const orgRepos = visibleRepos.filter((r) => r.split('/')[0] === org)
    const allSelected = orgRepos.every((r) => currentView.repos.includes(r))
    setViewFilters(section, {
      repos: allSelected
        ? currentView.repos.filter((r) => !orgRepos.includes(r))
        : [...new Set([...currentView.repos, ...orgRepos])],
    })
  }

  const handleMutedKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const trimmed = mutedInput.trim()
    if (trimmed) {
      addHiddenAuthor(trimmed)
      setMutedInput('')
    }
  }

  const handleHiddenRepoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const trimmed = hiddenRepoInput.trim()
    if (trimmed) {
      addHiddenRepo(trimmed)
      setHiddenRepoInput('')
      // drop any selected repos that are now globally hidden
      const remaining = currentView.repos.filter((r) => !r.includes(trimmed))
      if (remaining.length !== currentView.repos.length)
        setViewFilters(section, { repos: remaining })
    }
  }

  if (!hasContent) return null

  return (
    <>
      <ButtonWithTooltip
        label="Settings"
        onClick={() => setOpen((o) => !o)}
        buttonClassName={`relative flex items-center justify-center w-8 h-8 rounded-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
          ${open ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'}`}
      >
        <Settings size={16} />
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 text-[10px] font-medium bg-[var(--color-accent)] text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {activeCount}
          </span>
        )}
      </ButtonWithTooltip>

      <Modal isOpen={open} title={'Settings'} onClose={() => setOpen(false)} className="min-w-1/2">
        {orgs.length > 1 && (
          <div>
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
              Organization
            </p>
            <div className="flex flex-wrap gap-1 mb-3">
              {orgs.map((org) => {
                const orgRepos = visibleRepos.filter((r) => r.split('/')[0] === org)
                const selected = orgRepos.every((r) => currentView.repos.includes(r))
                return (
                  <button
                    key={org}
                    onClick={() => toggleOrg(org)}
                    className={`text-xs px-2 py-0.5 rounded-full cursor-pointer transition-colors
                          ${selected ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                  >
                    {org}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {repos.length > 1 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Repository{currentView.repos.length > 0 && ` (${currentView.repos.length})`}
              </p>
              {currentView.repos.length > 0 && (
                <button
                  onClick={() => setViewFilters(section, { repos: [] })}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {visibleRepos.map((repo) => {
                  const selected = currentView.repos.includes(repo)
                  return (
                    <label
                      key={repo}
                      className={`flex items-center gap-2 px-1 py-1 rounded cursor-pointer group
                            ${selected ? 'bg-[var(--color-accent-subtle)]' : 'hover:bg-[var(--color-surface-overlay)]'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRepo(repo)}
                        className="accent-[var(--color-accent)] cursor-pointer"
                      />
                      <span
                        className={`text-xs truncate ${selected ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]'}`}
                      >
                        {repo.split('/')[1]}
                      </span>
                    </label>
                  )
                })}
            </div>
          </div>
        )}

        {section !== 'authored' && (
          <>
            <div>
              <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Muted authors
                {globalFilters.hiddenAuthors.length > 0 &&
                  ` (${globalFilters.hiddenAuthors.length})`}
              </p>
              <input
                type="text"
                value={mutedInput}
                onChange={(e) => setMutedInput(e.target.value)}
                onKeyDown={handleMutedKeyDown}
                placeholder="e.g. renovate, dependabot"
                className="w-full text-xs px-2 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              {globalFilters.hiddenAuthors.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {globalFilters.hiddenAuthors.map((pattern) => (
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

            <div>
              <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Hidden repos
                {globalFilters.hiddenRepos.length > 0 && ` (${globalFilters.hiddenRepos.length})`}
              </p>
              <input
                type="text"
                value={hiddenRepoInput}
                onChange={(e) => setHiddenRepoInput(e.target.value)}
                onKeyDown={handleHiddenRepoKeyDown}
                placeholder="e.g. owner/repo or owner"
                className="w-full text-xs px-2 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              {globalFilters.hiddenRepos.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {globalFilters.hiddenRepos.map((repo) => (
                    <span
                      key={repo}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)]"
                    >
                      {repo}
                      <button
                        onClick={() => removeHiddenRepo(repo)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                        aria-label={`Remove ${repo}`}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
