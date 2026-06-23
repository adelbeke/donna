import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import type { Branch } from '../types/github'

const GH = 'https://api.github.com'
const DEFAULT_BRANCHES = new Set(['main', 'master', 'develop', 'development', 'staging', 'production'])

export function useBranches(repos: string[]) {
  const token = useAuthStore((s) => s.token)
  const login = useAuthStore((s) => s.user?.login)

  return useQuery<Branch[]>({
    queryKey: ['branches', repos],
    enabled: !!token && repos.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const headers = {
        Authorization: `Bearer ${token!}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      }
      const getList = async (path: string): Promise<any[]> => {
        const r = await fetch(`${GH}${path}`, { headers })
        if (!r.ok) return []
        const d = await r.json()
        return Array.isArray(d) ? d : []
      }

      const perRepo = await Promise.all(
        repos.map(async (repo) => {
          const allBranches: any[] = []
          for (let page = 1; ; page++) {
            const chunk = await getList(`/repos/${repo}/branches?per_page=100&page=${page}`)
            allBranches.push(...chunk)
            if (chunk.length < 100) break
          }

          const filtered = allBranches.filter((b) => !DEFAULT_BRANCHES.has(b.name))
          if (filtered.length === 0) return []

          const allPrs: any[] = []
          for (let page = 1; page <= 3; page++) {
            const chunk = await getList(`/repos/${repo}/pulls?state=all&per_page=100&page=${page}`)
            allPrs.push(...chunk)
            if (chunk.length < 100) break
          }

          const prByBranch = new Map<string, { number: number; state: string }>(
            allPrs.map((pr: any) => [
              pr.head.ref,
              { number: pr.number, state: pr.merged_at ? 'MERGED' : pr.state.toUpperCase() },
            ])
          )

          return filtered
            .filter((b: any) => !login || b.commit.author?.login === login)
            .map((b: any): Branch => ({
              name: b.name,
              repo,
              lastCommitDate: b.commit.commit.author.date,
              linkedPr: prByBranch.get(b.name),
            }))
        })
      )

      return perRepo
        .flat()
        .sort((a, b) => new Date(b.lastCommitDate).getTime() - new Date(a.lastCommitDate).getTime())
    },
  })
}
