import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, ADD_REVIEW_THREAD_MUTATION } from '@/providers/github'
import { prThreadsKey } from '../lib/queryKeys'
import type { PRKey, PullRequestReviewEvent } from '../types'

export type AddReviewInput = { pullRequestId: string; event: PullRequestReviewEvent; body: string }

// submitting an event (as opposed to omitting it) makes GitHub create AND submit the review
// in one call, so this needs no separate pending-review id the way useSubmitReview does
export const useAddReview = (key: PRKey) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, AddReviewInput>({
    mutationFn: async ({ pullRequestId, event, body }) => {
      await createClient().request(ADD_REVIEW_THREAD_MUTATION, {
        input: { pullRequestId, event, body: body || null },
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prThreadsKey(key) }),
  })
}
