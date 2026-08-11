import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createClient,
  RESOLVE_THREAD_MUTATION,
  UNRESOLVE_THREAD_MUTATION,
} from '@/providers/github'
import { prThreadsKey } from '../lib/queryKeys'
import type { PRKey } from '../types'
import type { PRThreadsResult } from './usePRThreads'

export type ResolveThreadInput = { threadId: string; resolve: boolean }

export const useResolveThread = (key: PRKey) => {
  const queryClient = useQueryClient()
  const queryKey = prThreadsKey(key)

  return useMutation<void, Error, ResolveThreadInput, { previous?: PRThreadsResult }>({
    mutationFn: async ({ threadId, resolve }) => {
      const mutation = resolve ? RESOLVE_THREAD_MUTATION : UNRESOLVE_THREAD_MUTATION
      await createClient().request(mutation, { threadId })
    },
    // optimistic: a single reversible boolean flip, worth the extra plumbing so a resolve
    // click doesn't sit dead for the round trip
    onMutate: async ({ threadId, resolve }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<PRThreadsResult>(queryKey)
      if (previous) {
        queryClient.setQueryData<PRThreadsResult>(queryKey, {
          ...previous,
          threads: previous.threads.map((t) =>
            t.id === threadId ? { ...t, isResolved: resolve } : t
          ),
        })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}
