import { useQuery } from '@tanstack/react-query'
import { createClient, VIEWER_QUERY } from '../lib/github'
import { useAuthStore } from '../store/authStore'
import type { GitHubUser } from '../types/github'

interface ViewerResult {
  viewer: GitHubUser
}

export function useViewer() {
  const token = useAuthStore((s) => s.token)

  return useQuery<GitHubUser>({
    queryKey: ['viewer'],
    enabled: !!token,
    queryFn: async () => {
      const client = createClient(token)
      const data = await client.request<ViewerResult>(VIEWER_QUERY)
      return data.viewer
    },
  })
}
