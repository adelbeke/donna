import { useQuery } from '@tanstack/react-query'
import { createClient, PR_CHECK_CONTEXTS_QUERY } from '@/lib/github'
import { useAuthStore } from '@/features/auth/stores/authStore'
import type { CheckRunContext, StatusContextItem } from '@/types/github'

interface CheckContextsResult {
  node: {
    commits: {
      nodes: {
        commit: {
          statusCheckRollup: {
            contexts: { nodes: (CheckRunContext | StatusContextItem)[] }
          } | null
        }
      }[]
    }
  } | null
}

export function useCheckContexts(prId: string, enabled: boolean) {
  const token = useAuthStore((s) => s.token)
  const userLogin = useAuthStore((s) => s.user?.login)

  const query = useQuery<CheckContextsResult>({
    queryKey: ['pr-checks', prId, userLogin],
    enabled: enabled && !!token,
    staleTime: 30_000,
    queryFn: async () => {
      const client = createClient(token)
      return client.request<CheckContextsResult>(PR_CHECK_CONTEXTS_QUERY, { nodeId: prId })
    },
  })

  const checks: (CheckRunContext | StatusContextItem)[] =
    query.data?.node?.commits.nodes[0]?.commit?.statusCheckRollup?.contexts.nodes ?? []

  return { checks, isLoading: query.isFetching }
}
