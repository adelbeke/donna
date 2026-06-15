import { useQuery } from '@tanstack/react-query'
import { createGitHubClient, PR_CHECK_CONTEXTS_QUERY } from '../lib/github'
import { useAuthStore } from '../store/authStore'
import type { CheckRunContext, StatusContextItem } from '../types/github'

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
      const client = createGitHubClient(token!)
      return client.request<CheckContextsResult>(PR_CHECK_CONTEXTS_QUERY, { nodeId: prId })
    },
  })

  const checks: (CheckRunContext | StatusContextItem)[] =
    query.data?.node?.commits.nodes[0]?.commit?.statusCheckRollup?.contexts.nodes ?? []

  return { checks, isLoading: query.isFetching }
}
