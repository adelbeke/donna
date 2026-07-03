import { useQuery } from '@tanstack/react-query'
import { createClient, VIEWER_QUERY } from '@/providers/github'
import { useAuthStore } from '@/features/auth/stores/authStore'
import type { GitHubUser } from '@/types/github'

type ViewerResult = {
  viewer: GitHubUser
}

export const useViewer = () => {
  const token = useAuthStore((s) => s.token)

  return useQuery<GitHubUser>({
    queryKey: ['viewer'],
    enabled: !!token,
    queryFn: async () => {
      const client = createClient()
      const data = await client.request<ViewerResult>(VIEWER_QUERY)
      return data.viewer
    },
  })
}
