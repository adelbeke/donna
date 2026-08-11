import { useQuery } from '@tanstack/react-query'
import { createClient, VIEWER_TEAMS_QUERY } from '@/providers/github'
import { useAuthStore } from '@/features/auth/stores/authStore'

type TeamsResult = {
  organization: { teams: { nodes: { combinedSlug: string }[] } } | null
}

// ponytail: no read:org scope (or a user-owned repo) degrades to login-only matching rather than
// failing the page. The toggle's tooltip says so.
const fetchViewerHandles = async (org: string, login: string): Promise<string[]> => {
  try {
    const client = createClient()
    const data = await client.request<TeamsResult>(VIEWER_TEAMS_QUERY, { org, login })
    const teamHandles = data.organization?.teams.nodes.map((t) => `@${t.combinedSlug}`) ?? []
    return [`@${login}`, ...teamHandles]
  } catch {
    return [`@${login}`]
  }
}

export const useViewerHandles = (org: string) => {
  const token = useAuthStore((s) => s.token)
  const login = useAuthStore((s) => s.user?.login ?? '')

  return useQuery<string[]>({
    queryKey: ['viewer-handles', org, login],
    enabled: !!token && !!login && !!org,
    staleTime: 5 * 60_000,
    queryFn: () => fetchViewerHandles(org, login),
  })
}
