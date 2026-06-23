import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { restFetch } from '../lib/github'
import type { Repo } from './useRepos'

const GH = 'https://api.github.com'
const MAX_RECENT = 10

export function useRecentRepos() {
  const token = useAuthStore((s) => s.token)
  const login = useAuthStore((s) => s.user?.login)

  return useQuery<Repo[]>({
    queryKey: ['recent-repos', login],
    enabled: !!token && !!login,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      try {
        const events = await restFetch<{ repo?: { name: string } }[]>(
          `${GH}/users/${login}/events?per_page=100`,
          token!
        )
        const seen = new Set<string>()
        for (const e of events) {
          if (e.repo?.name) seen.add(e.repo.name)
          if (seen.size >= MAX_RECENT) break
        }
        return [...seen].map((full_name) => ({ full_name, name: full_name.split('/')[1] }))
      } catch {
        return []
      }
    },
  })
}
