import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, ADD_ISSUE_COMMENT_MUTATION } from '@/providers/github'
import { prThreadsKey } from '../lib/queryKeys'
import type { PRKey } from '../types'

export type AddCommentInput = { subjectId: string; body: string }

export const useAddComment = (key: PRKey) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, AddCommentInput>({
    mutationFn: async ({ subjectId, body }) => {
      await createClient().request(ADD_ISSUE_COMMENT_MUTATION, { subjectId, body })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prThreadsKey(key) }),
  })
}
