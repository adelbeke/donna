import { useQuery } from '@tanstack/react-query'
import type { Worktree } from '../types/worktree'

export function useWorktrees(repoPath: string | null) {
  return useQuery<Worktree[]>({
    queryKey: ['worktrees', repoPath],
    enabled: !!repoPath && !!window.electronAPI,
    staleTime: 30_000,
    queryFn: () => window.electronAPI!.worktrees.list(repoPath!),
  })
}
