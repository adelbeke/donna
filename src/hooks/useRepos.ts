import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'

const GH = 'https://api.github.com'

export type Repo = { full_name: string; name: string }

export function useRepos() {
  const token = useAuthStore((s) => s.token)

  return useQuery<Repo[]>({
    queryKey: ['repos'],
    enabled: !!token,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const headers = {
        Authorization: `Bearer ${token!}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      }
      const repos: Repo[] = []
      for (let page = 1; page <= 10; page++) {
        const r = await fetch(
          `${GH}/user/repos?affiliation=owner,collaborator,organization_member&sort=pushed&per_page=100&page=${page}`,
          { headers }
        )
        if (!r.ok) break
        const chunk = await r.json()
        repos.push(...chunk.map((r: { full_name: string; name: string }) => ({ full_name: r.full_name, name: r.name })))
        if (chunk.length < 100) break
      }
      return repos
    },
  })
}
