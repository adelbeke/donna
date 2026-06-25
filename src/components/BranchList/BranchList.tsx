import { useQueries } from '@tanstack/react-query'
import { Copy, ExternalLink, FolderPlus, MoreVertical, RefreshCw, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { usePRStore } from '../../store/prStore'
import { useBranchStore } from '../../store/branchStore'
import { usePullRequests } from '../../hooks/useGitHubPRs'
import { CopyWithFeedback } from '../shared/CopyWithFeedback'
import type { Worktree } from '../../types/worktree'
import type { PullRequest } from '../../types/github'

const REPO_HUES = [210, 140, 30, 280, 180, 60, 320, 260]

export function BranchCard({
  branch,
  repo,
  repoPath,
  hue,
  isCurrentBranch,
  worktree,
  pr,
  onDeleted,
}: {
  branch: string
  repo: string
  repoPath: string
  hue: number
  isCurrentBranch: boolean
  worktree?: Worktree
  pr?: PullRequest
  onDeleted: () => void
}) {
  const shortPath = worktree?.path.replace(/^\/Users\/[^/]+/, '~')
  const isProtected = branch === 'main' || branch === 'master'
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function deleteBranch() {
    const message = isCurrentBranch
      ? `Delete branch "${branch}"?\n\nYou're currently on this branch — git will switch to main first.`
      : `Delete branch "${branch}"?\nThe branch must be fully merged.`
    if (!window.confirm(message)) return
    setIsMenuOpen(false)
    try {
      if (isCurrentBranch) await window.electronAPI!.branches.switchToDefault(repoPath)
      await window.electronAPI!.branches.delete(repoPath, branch)
      onDeleted()
    } catch (e) {
      setDeleteError((e as Error).message)
    }
  }

  async function removeWorktree() {
    const wt = worktree!
    const message = wt.isDirty
      ? `⚠️ "${branch}" has uncommitted changes.\n\nRemoving this worktree will permanently delete those changes.\n\nAre you sure?`
      : `Remove worktree at "${wt.path}"?`
    if (!window.confirm(message)) return
    setIsMenuOpen(false)
    try {
      await window.electronAPI!.worktrees.remove(repoPath, wt.path, wt.isDirty)
      onDeleted()
    } catch (e) {
      setDeleteError((e as Error).message)
    }
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          style={{
            backgroundColor: `hsla(${hue}, 65%, 50%, 0.18)`,
            color: `hsl(${hue}, 70%, 65%)`,
          }}
          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
        >
          {repo}
        </span>
        <span className="text-sm font-medium text-[var(--color-text-primary)] font-mono">
          {branch}
        </span>
        <CopyWithFeedback text={branch} label="Copy branch name" />
        {worktree && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
            worktree
          </span>
        )}
        {worktree?.isDirty && (
          <span
            title="Uncommitted changes"
            className="w-2 h-2 rounded-full bg-yellow-400 inline-block"
          />
        )}
        <div className="ml-auto flex items-center gap-1">
          {pr && (
            <a
              href={pr.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-[var(--color-border-subtle)] text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors font-mono"
            >
              #{pr.number}
              <ExternalLink size={10} />
            </a>
          )}
          {!isProtected && <div className="relative">
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              title="More actions"
              className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer"
            >
              <MoreVertical size={14} />
            </button>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-lg py-1">
                  {worktree ? (
                    <button
                      onClick={removeWorktree}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-danger)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                      Remove worktree
                    </button>
                  ) : (
                    <button
                      onClick={deleteBranch}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-danger)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                      Delete branch
                    </button>
                  )}
                </div>
              </>
            )}
          </div>}
        </div>
      </div>
      {deleteError && (
        <p className="text-xs text-[var(--color-danger)]">{deleteError}</p>
      )}
      <div className="flex gap-2 items-center">
        {worktree && (
          <CopyWithFeedback
            text={`cd ${worktree.path}`}
            label="Copy cd command"
            buttonClassName="flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] transition-colors cursor-pointer font-mono"
          >
            <Copy size={11} />
            cd {shortPath}
          </CopyWithFeedback>
        )}
        <CopyWithFeedback
          text={`git switch ${branch}`}
          label="Copy git switch command"
          buttonClassName="flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] transition-colors cursor-pointer font-mono"
        >
          <Copy size={11} />
          git switch {branch}
        </CopyWithFeedback>
      </div>
    </div>
  )
}

export default function BranchList() {
  const { localPaths, addLocalPath, removeLocalPath } = useBranchStore()
  const { filters } = usePRStore()
  const { allPRs } = usePullRequests()

  const branchQueries = useQueries({
    queries: localPaths.map((p) => ({
      queryKey: ['branches', p],
      queryFn: () => window.electronAPI!.branches.list(p),
      staleTime: 30_000,
    })),
  })

  const worktreeQueries = useQueries({
    queries: localPaths.map((p) => ({
      queryKey: ['worktrees', p],
      queryFn: () => window.electronAPI!.worktrees.list(p),
      staleTime: 30_000,
    })),
  })

  // Map repoName+branch → PR for O(1) lookup
  const prMap = useMemo(() => {
    const m = new Map<string, PullRequest>()
    for (const pr of allPRs ?? []) {
      m.set(`${pr.repository.name}/${pr.headRefName}`, pr)
    }
    return m
  }, [allPRs])

  async function addRepo() {
    const picked = await window.electronAPI!.dialog.openDirectory()
    if (picked && !localPaths.includes(picked)) addLocalPath(picked)
  }

  function refetchAll() {
    branchQueries.forEach((q) => q.refetch())
    worktreeQueries.forEach((q) => q.refetch())
  }

  const isFetching =
    branchQueries.some((q) => q.isFetching) || worktreeQueries.some((q) => q.isFetching)

  if (localPaths.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">No repositories added</p>
        <button
          onClick={addRepo}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-[var(--color-accent)] text-white cursor-pointer"
        >
          <FolderPlus size={13} />
          Add repository
        </button>
      </div>
    )
  }

  type FlatItem =
    | { key: string; loading: true; repoLabel: string }
    | { key: string; error: string; repoLabel: string }
    | {
        key: string
        branch: string
        repoLabel: string
        repoPath: string
        hue: number
        isCurrentBranch: boolean
        worktree?: Worktree
        pr?: PullRequest
      }

  const flatBranches: FlatItem[] = []
  for (let i = 0; i < localPaths.length; i++) {
    const localPath = localPaths[i]
    const repoLabel = localPath.split('/').pop() ?? localPath
    const {
      data: branches,
      isLoading: bLoading,
      isError: bError,
      error: bErrObj,
    } = branchQueries[i]
    const {
      data: worktrees,
      isLoading: wLoading,
      isError: wError,
      error: wErrObj,
    } = worktreeQueries[i]

    if (bLoading || wLoading) {
      flatBranches.push({ key: localPath, loading: true, repoLabel })
      continue
    }
    if (bError || wError) {
      const errMsg = ((bErrObj || wErrObj) as Error)?.message ?? 'Failed to load.'
      flatBranches.push({ key: localPath, error: errMsg, repoLabel })
      continue
    }

    const wtByBranch = new Map<string, Worktree>()
    for (const wt of worktrees ?? []) {
      if (wt.branch && !wt.isMain) wtByBranch.set(wt.branch, wt)
    }
    const mainBranch = (worktrees ?? []).find((wt) => wt.isMain)?.branch ?? ''

    for (const branch of (branches ?? []).filter(
      (b) => !filters.search || b.toLowerCase().includes(filters.search.toLowerCase())
    )) {
      flatBranches.push({
        key: `${localPath}/${branch}`,
        branch,
        repoLabel,
        repoPath: localPath,
        hue: REPO_HUES[i % REPO_HUES.length],
        isCurrentBranch: branch === mainBranch,
        worktree: wtByBranch.get(branch),
        pr: prMap.get(`${repoLabel}/${branch}`),
      })
    }
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={addRepo}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] transition-colors cursor-pointer"
        >
          <FolderPlus size={13} />
          Add repo
        </button>
        <button
          onClick={refetchAll}
          disabled={isFetching}
          title="Refresh"
          className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer disabled:opacity-40"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
        </button>
        {localPaths.map((p, i) => {
          const label = p.split('/').pop() ?? p
          const color = `hsl(${REPO_HUES[i % REPO_HUES.length]}, 70%, 65%)`
          return (
            <button
              key={p}
              onClick={() => removeLocalPath(p)}
              title={`Remove ${label}`}
              style={{ color }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-danger)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = color
              }}
              className="flex items-center gap-1 text-xs transition-colors cursor-pointer"
            >
              <X size={12} />
              {label}
            </button>
          )
        })}
      </div>

      <div className="space-y-2">
        {flatBranches.map((item) => {
          if ('loading' in item) {
            return (
              <p key={item.key} className="text-xs text-[var(--color-text-muted)]">
                Loading {item.repoLabel}…
              </p>
            )
          }
          if ('error' in item) {
            return (
              <p key={item.key} className="text-xs text-[var(--color-danger)]">
                {item.repoLabel}: {item.error}
              </p>
            )
          }
          return (
            <BranchCard
              key={item.key}
              branch={item.branch}
              repo={item.repoLabel}
              repoPath={item.repoPath}
              isCurrentBranch={item.isCurrentBranch}
              hue={item.hue}
              worktree={item.worktree}
              pr={item.pr}
              onDeleted={refetchAll}
            />
          )
        })}
        {flatBranches.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">No branches found.</p>
        )}
      </div>
    </div>
  )
}
