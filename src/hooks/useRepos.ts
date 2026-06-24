import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { restFetch } from '../lib/github'

const GH = 'https://api.github.com'

export type Repo = { full_name: string; name: string }

export function useRepos() {
  const token = useAuthStore((s) => s.token)

  return useQuery<Repo[]>({
    queryKey: ['repos'],
    enabled: !!token,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const repos: Repo[] = []
      for (let page = 1; page <= 10; page++) {
        try {
          const chunk = await restFetch<{ full_name: string; name: string }[]>(
            `${GH}/user/repos?affiliation=owner,collaborator,organization_member&sort=pushed&per_page=100&page=${page}`,
            token!
          )
          repos.push(...chunk.map((r) => ({ full_name: r.full_name, name: r.name })))
          if (chunk.length < 100) break
        } catch {
          break
        }
      }
      return repos
    },
  })
}
