import { useState } from 'react'
import { Copy, FolderOpen, RefreshCw } from 'lucide-react'
import { useWorktrees } from '../../hooks/useWorktrees'
import { usePRStore } from '../../store/prStore'
import type { Worktree } from '../../types/worktree'

function WorktreeCard({ wt }: { wt: Worktree }) {
  const shortPath = wt.path.replace(/^\/Users\/[^/]+/, '~')
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 space-y-2">
      <div className="flex items-baseline gap-2">
        {wt.isMain && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
            main
          </span>
        )}
        <span className="text-sm font-medium text-[var(--color-text-primary)] font-mono">
          {wt.branch || '(detached)'}
        </span>
        <span className="ml-auto text-xs text-[var(--color-text-muted)] font-mono">{wt.commit}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-text-muted)] truncate flex-1">{shortPath}</span>
        <button
          onClick={() => navigator.clipboard.writeText(`cd ${wt.path}`)}
          title="Copy cd command"
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] transition-colors cursor-pointer font-mono shrink-0"
        >
          <Copy size={11} />
          cd
        </button>
      </div>
    </div>
  )
}

export default function WorktreeList() {
  const [repoPath, setRepoPath] = useState<string | null>(
    () => localStorage.getItem('worktree-path')
  )
  const { filters } = usePRStore()
  const { data: worktrees, isLoading, isError, isFetching, refetch } = useWorktrees(repoPath)

  async function pickDirectory() {
    const picked = await window.electronAPI!.dialog.openDirectory()
    if (picked) {
      localStorage.setItem('worktree-path', picked)
      setRepoPath(picked)
    }
  }

  const visible = (worktrees ?? []).filter(
    (wt) => !filters.search || wt.branch.toLowerCase().includes(filters.search.toLowerCase())
  )

  if (!repoPath) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center flex-1">
        <p className="text-sm text-[var(--color-text-muted)]">Pick a git repository to see its worktrees</p>
        <button
          onClick={pickDirectory}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-[var(--color-accent)] text-white cursor-pointer"
        >
          <FolderOpen size={13} />
          Open repository
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={pickDirectory}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer truncate max-w-xs"
          title={repoPath}
        >
          {repoPath.replace(/^\/Users\/[^/]+/, '~')} · Change
        </button>
        <button
          onClick={() => void refetch()}
          disabled={isFetching}
          title="Refresh"
          className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer disabled:opacity-40"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {isLoading && <p className="text-sm text-[var(--color-text-muted)]">Loading worktrees…</p>}
      {isError && <p className="text-sm text-[var(--color-danger)]">Failed to list worktrees. Is this a git repo?</p>}
      {!isLoading && !isError && visible.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)]">No worktrees found.</p>
      )}

      <div className="space-y-2">
        {visible.map((wt) => (
          <WorktreeCard key={wt.path} wt={wt} />
        ))}
      </div>
    </div>
  )
}
