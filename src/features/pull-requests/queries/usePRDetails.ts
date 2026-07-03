import { useQuery } from '@tanstack/react-query'
import { createClient, PR_DETAILS_SINGLE_QUERY } from '@/providers/github'
import { useAuthStore } from '@/features/auth/stores/authStore'
import type { PullRequest } from '@/types/github'

type NodeResult = {
  node: Pick<PullRequest, 'id' | 'mergeable' | 'commits' | 'reviewRequests' | 'reviews'>
}

export const usePRDetails = (prId: string) => {
  const token = useAuthStore((s) => s.token)
  return useQuery<NodeResult['node']>({
    queryKey: ['pr-details', prId],
    enabled: !!token,
    staleTime: 60_000,
    queryFn: async () => {
      const data = await createClient().request<NodeResult>(PR_DETAILS_SINGLE_QUERY, {
        nodeId: prId,
      })
      return data.node
    },
  })
}
