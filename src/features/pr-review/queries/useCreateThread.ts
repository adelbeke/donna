import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, ADD_REVIEW_THREAD_MUTATION } from '@/providers/github'
import { prThreadsKey } from '../lib/queryKeys'
import type { DiffSide, PRKey } from '../types'

export type CreateThreadInput = {
  pullRequestId: string
  path: string
  line: number
  side: DiffSide
  startLine?: number
  startSide?: DiffSide
  body: string
}

export const useCreateThread = (key: PRKey) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, CreateThreadInput>({
    mutationFn: async ({ pullRequestId, path, line, side, startLine, startSide, body }) => {
      await createClient().request(ADD_REVIEW_THREAD_MUTATION, {
        input: {
          pullRequestId,
          event: 'COMMENT',
          threads: [{ path, line, side, startLine, startSide, body }],
        },
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prThreadsKey(key) }),
  })
}
