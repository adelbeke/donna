import { useQueries } from '@tanstack/react-query'
import { Copy, ExternalLink, FolderPlus, RefreshCw, X } from 'lucide-react'
import { useMemo } from 'react'
import { usePRStore } from '../../store/prStore'
import { useBranchStore } from '../../store/branchStore'
import { usePullRequests } from '../../hooks/useGitHubPRs'
import { CopyWithFeedback } from '../shared/CopyWithFeedback'
import type { Worktree } from '../../types/worktree'
import type { PullRequest } from '../../types/github'

const REPO_HUES = [210, 140, 30, 280, 180, 60, 320, 260]

function BranchCard({
  branch,
  repo,
  hue,
  worktree,
  pr,
}: {
  branch: string
  repo: string
  hue: number
  worktree?: Worktree
  pr?: PullRequest
}) {
  const shortPath = worktree?.path.replace(/^\/Users\/[^/]+/, '~')

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          style={{ backgroundColor: `hsla(${hue}, 65%, 50%, 0.18)`, color: `hsl(${hue}, 70%, 65%)` }}
          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
        >
          {repo}
        </span>
        <span className="text-sm font-medium text-[var(--color-text-primary)] font-mono">{branch}</span>
        <CopyWithFeedback text={branch} label="Copy branch name" />
        {worktree && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
            worktree
          </span>
        )}
        {worktree?.isDirty && (
          <span title="Uncommitted changes" className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
        )}
        {pr && (
          <a
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-[var(--color-border-subtle)] text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors font-mono"
          >
            #{pr.number}
            <ExternalLink size={10} />
          </a>
        )}
      </div>
      <div className="flex gap-2 items-center">
        {worktree && (
          <button
            onClick={() => navigator.clipboard.writeText(`cd ${worktree.path}`)}
            title={`Copy: cd ${worktree.path}`}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] transition-colors cursor-pointer font-mono"
          >
            <Copy size={11} />
            cd {shortPath}
          </button>
        )}
        <button
          onClick={() => navigator.clipboard.writeText(`git switch ${branch}`)}
          title={`Copy: git switch ${branch}`}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] transition-colors cursor-pointer font-mono"
        >
          <Copy size={11} />
          git switch {branch}
        </button>
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

  const isFetching = branchQueries.some((q) => q.isFetching) || worktreeQueries.some((q) => q.isFetching)

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
    | { key: string; branch: string; repoLabel: string; hue: number; worktree?: Worktree; pr?: PullRequest }

  const flatBranches: FlatItem[] = []
  for (let i = 0; i < localPaths.length; i++) {
    const localPath = localPaths[i]
    const repoLabel = localPath.split('/').pop() ?? localPath
    const { data: branches, isLoading: bLoading, isError: bError, error: bErrObj } = branchQueries[i]
    const { data: worktrees, isLoading: wLoading, isError: wError, error: wErrObj } = worktreeQueries[i]

    if (bLoading || wLoading) { flatBranches.push({ key: localPath, loading: true, repoLabel }); continue }
    if (bError || wError) {
      const errMsg = ((bErrObj || wErrObj) as Error)?.message ?? 'Failed to load.'
      flatBranches.push({ key: localPath, error: errMsg, repoLabel })
      continue
    }

    const wtByBranch = new Map<string, Worktree>()
    for (const wt of worktrees ?? []) {
      if (wt.branch && !wt.isMain) wtByBranch.set(wt.branch, wt)
    }

    for (const branch of (branches ?? []).filter(
      (b) => !filters.search || b.toLowerCase().includes(filters.search.toLowerCase())
    )) {
      flatBranches.push({
        key: `${localPath}/${branch}`,
        branch,
        repoLabel,
        hue: REPO_HUES[i % REPO_HUES.length],
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
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-danger)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = color }}
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
            return <p key={item.key} className="text-xs text-[var(--color-text-muted)]">Loading {item.repoLabel}…</p>
          }
          if ('error' in item) {
            return <p key={item.key} className="text-xs text-[var(--color-danger)]">{item.repoLabel}: {item.error}</p>
          }
          return (
            <BranchCard
              key={item.key}
              branch={item.branch}
              repo={item.repoLabel}
              hue={item.hue}
              worktree={item.worktree}
              pr={item.pr}
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
