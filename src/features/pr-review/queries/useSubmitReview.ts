import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, SUBMIT_REVIEW_MUTATION } from '@/providers/github'
import { prThreadsKey } from '../lib/queryKeys'
import type { PRKey, PullRequestReviewEvent } from '../types'

export type SubmitReviewInput = { reviewId: string; event: PullRequestReviewEvent; body: string }

export const useSubmitReview = (key: PRKey) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, SubmitReviewInput>({
    mutationFn: async ({ reviewId, event, body }) => {
      await createClient().request(SUBMIT_REVIEW_MUTATION, {
        reviewId,
        event,
        body: body || null,
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prThreadsKey(key) }),
  })
}
