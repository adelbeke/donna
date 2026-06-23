import { useEffect, useState } from 'react'
import { Copy, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useBranches } from '../../hooks/useBranches'
import { useDeleteBranch } from '../../hooks/useDeleteBranch'
import { useRecentRepos } from '../../hooks/useRecentRepos'
import { usePRStore } from '../../store/prStore'
import { useBranchStore } from '../../store/branchStore'
import { timeAgo } from '../../lib/timeAgo'
import type { Branch } from '../../types/github'

function CopyButton({ text, title }: { text: string; title: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      title={title}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] transition-colors cursor-pointer font-mono"
    >
      <Copy size={11} />
      {text}
    </button>
  )
}

export function BranchCard({ branch }: { branch: Branch }) {
  const { mutate: deleteBranch, isPending, isError } = useDeleteBranch()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex items-baseline gap-2 min-w-0 flex-1">
          <span className="text-xs text-[var(--color-text-muted)] shrink-0">{branch.repo}</span>
          <span className="text-sm font-medium text-[var(--color-text-primary)] font-mono truncate">{branch.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 h-6">
          {confirming ? (
            <>
              {branch.linkedPr?.state === 'OPEN' && (
                <span className="text-xs text-[var(--color-danger)]">
                  Has open PR #{branch.linkedPr.number}
                </span>
              )}
              <span className="text-xs text-[var(--color-text-muted)]">Delete branch?</span>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteBranch(
                    { repo: branch.repo, name: branch.name },
                    { onSettled: () => setConfirming(false) }
                  )
                }
                disabled={isPending}
                className="text-xs px-2 py-0.5 rounded border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                {isPending ? <Loader2 size={12} className="animate-spin" /> : 'Delete'}
              </button>
            </>
          ) : (
            <>
              <span className="text-xs text-[var(--color-text-muted)]">{timeAgo(branch.lastCommitDate)}</span>
              <button
                onClick={() => setConfirming(true)}
                title="Delete branch"
                className="transition-colors cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
      {isError && (
        <span className="text-xs text-[var(--color-danger)]">Delete failed. Try again.</span>
      )}
      <div className="flex gap-2 flex-wrap">
        <CopyButton text={`git switch ${branch.name}`} title="Copy git switch command" />
        {branch.linkedPr?.state === 'OPEN' && (
          <a
            href={branch.linkedPr.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] transition-colors font-mono"
          >
            #{branch.linkedPr.number} open PR
          </a>
        )}
      </div>
    </div>
  )
}

function RepoPicker({
  repos,
  selected,
  onConfirm,
}: {
  repos: { full_name: string; name: string }[]
  selected: string[]
  onConfirm: (repos: string[]) => void
}) {
  const [draft, setDraft] = useState<string[]>(selected)
  const [search, setSearch] = useState('')

  function toggle(repo: string) {
    setDraft((prev) => prev.includes(repo) ? prev.filter((r) => r !== repo) : [...prev, repo])
  }

  const visible = repos.filter((r) => r.full_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
        Select repos to browse branches
      </p>
      <input
        type="text"
        placeholder="Search repos…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full text-xs px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
      />
      <div className="space-y-0.5 flex-1 overflow-y-auto min-h-0">
        {visible.map((repo) => {
          const sel = draft.includes(repo.full_name)
          return (
            <label
              key={repo.full_name}
              className={`flex items-center gap-2 px-1 py-1 rounded cursor-pointer group
                ${sel ? 'bg-[var(--color-accent-subtle)]' : 'hover:bg-[var(--color-surface-overlay)]'}`}
            >
              <input
                type="checkbox"
                checked={sel}
                onChange={() => toggle(repo.full_name)}
                className="accent-[var(--color-accent)] cursor-pointer"
              />
              <span className={`text-xs truncate ${sel ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}`}>
                {repo.full_name}
              </span>
            </label>
          )
        })}
      </div>
      <button
        onClick={() => onConfirm(draft)}
        disabled={draft.length === 0}
        className="text-xs px-3 py-1.5 rounded bg-[var(--color-accent)] text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
      >
        Show branches{draft.length > 0 ? ` (${draft.length} repo${draft.length > 1 ? 's' : ''})` : ''}
      </button>
    </div>
  )
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl shadow-xl p-4 w-80 h-96 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export default function BranchList() {
  const { selectedRepos: selectedBranchRepos, setSelectedRepos: setSelectedBranchRepos } = useBranchStore()
  const { filters } = usePRStore()
  const { data: repos, isLoading: reposLoading } = useRecentRepos()
  const { data: branches, isLoading: branchesLoading, isFetching: branchesFetching, isError, refetch } = useBranches(selectedBranchRepos)
  const [pickerOpen, setPickerOpen] = useState(selectedBranchRepos.length === 0)

  const visible = (branches ?? []).filter(
    (b) => !filters.search || b.name.toLowerCase().includes(filters.search.toLowerCase())
  )

  return (
    <div className="flex-1 space-y-4">
      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)}>
        {repos && (
          <RepoPicker
            repos={repos}
            selected={selectedBranchRepos}
            onConfirm={(r) => { setSelectedBranchRepos(r); setPickerOpen(false) }}
          />
        )}
      </Modal>

      {selectedBranchRepos.length === 0 ? (
        reposLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading repos…</p>
        ) : !repos?.length ? (
          <p className="text-sm text-[var(--color-text-muted)]">No repos found.</p>
        ) : (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">No repos selected</p>
            <button
              onClick={() => setPickerOpen(true)}
              className="text-xs px-3 py-1.5 rounded bg-[var(--color-accent)] text-white cursor-pointer"
            >
              Select repos
            </button>
          </div>
        )
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setPickerOpen(true)}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              {selectedBranchRepos.length} repo{selectedBranchRepos.length > 1 ? 's' : ''} · Edit
            </button>
            <button
              onClick={() => void refetch()}
              disabled={branchesFetching}
              title="Refresh"
              className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
            >
              <RefreshCw size={14} className={branchesFetching ? 'animate-spin' : ''} />
            </button>
          </div>

          {branchesLoading && <p className="text-sm text-[var(--color-text-muted)]">Loading branches…</p>}
          {isError && <p className="text-sm text-[var(--color-danger)]">Failed to load branches.</p>}
          {!branchesLoading && !isError && visible.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">No branches found.</p>
          )}

          <div className="space-y-2">
            {visible.map((b) => (
              <BranchCard key={`${b.repo}/${b.name}`} branch={b} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
