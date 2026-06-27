import { useQueries } from '@tanstack/react-query'
import { FolderPlus, RefreshCw, X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { usePullRequests } from '@/features/pull-requests/exports'
import { useBranchStore } from '../../stores/branchStore'
import type { Worktree } from '../../types'
import type { PullRequest } from '@/types/github'
import { BranchCard } from '@/features/branches/components/BranchList/BranchCard/BranchCard.tsx'

const REPO_HUES = [210, 140, 30, 280, 180, 60, 320, 260]

export const BranchList = () => {
  const { localPaths, addLocalPath, removeLocalPath } = useBranchStore()
  const { branchSearch } = useBranchStore()
  const { allPRs } = usePullRequests()

  useEffect(() => {
    window
      .electronAPI!.dirs.filterExisting(localPaths)
      .then((existing) => {
        localPaths.filter((p) => !existing.includes(p)).forEach(removeLocalPath)
      })
      .catch(() => {}) // silently ignore — stale paths survive until next mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // ponytail: run once on mount — stale paths from previous session

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

  const addRepo = async () => {
    const picked = await window.electronAPI!.dialog.openDirectory()
    if (picked && !localPaths.includes(picked)) addLocalPath(picked)
  }

  const refetchAll = () => {
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
    // ponytail: branches checked out in *any* worktree (incl. main) are "current".
    const currentBranches = new Set<string>()
    for (const wt of worktrees ?? []) {
      if (wt.branch) currentBranches.add(wt.branch)
      if (wt.branch && !wt.isMain) wtByBranch.set(wt.branch, wt)
    }

    const repoItems = (branches ?? [])
      .filter((b) => !branchSearch || b.name.toLowerCase().includes(branchSearch.toLowerCase()))
      .map((branch) => ({
        key: `${localPath}/${branch.name}`,
        branch: branch.name,
        repoLabel,
        repoPath: localPath,
        hue: REPO_HUES[i % REPO_HUES.length],
        // `*` from git branch (main worktree) OR checked out in a linked worktree
        isCurrentBranch: branch.isCurrent || currentBranches.has(branch.name),
        worktree: wtByBranch.get(branch.name),
        pr: prMap.get(`${repoLabel}/${branch.name}`),
      }))
    // ponytail: float current branch(es) to the top of their repo; stable otherwise.
    repoItems.sort((a, b) => Number(b.isCurrentBranch) - Number(a.isCurrentBranch))
    flatBranches.push(...repoItems)
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
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
