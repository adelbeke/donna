import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, DELETE_REVIEW_MUTATION } from '@/providers/github'
import { prThreadsKey } from '../lib/queryKeys'
import type { PRKey } from '../types'

export type DiscardReviewInput = { reviewId: string }

export const useDiscardReview = (key: PRKey) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, DiscardReviewInput>({
    mutationFn: async ({ reviewId }) => {
      await createClient().request(DELETE_REVIEW_MUTATION, { reviewId })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prThreadsKey(key) }),
  })
}
