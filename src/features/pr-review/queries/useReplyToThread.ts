import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, ADD_THREAD_REPLY_MUTATION } from '@/providers/github'
import { prThreadsKey } from '../lib/queryKeys'
import type { PRKey } from '../types'

export type ReplyToThreadInput = { threadId: string; body: string }

export const useReplyToThread = (key: PRKey) => {
  const queryClient = useQueryClient()

  // ponytail: invalidate rather than optimistically append — the server assigns the comment
  // id/url/timestamp, and the round trip is sub-second, so faking those is not worth the risk
  return useMutation<void, Error, ReplyToThreadInput>({
    mutationFn: async ({ threadId, body }) => {
      await createClient().request(ADD_THREAD_REPLY_MUTATION, { threadId, body })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prThreadsKey(key) }),
  })
}
