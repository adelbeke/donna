import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createClient,
  ADD_REVIEW_THREAD_MUTATION,
  ADD_PENDING_REVIEW_THREAD_MUTATION,
} from '@/providers/github'
import { prThreadsKey } from '../lib/queryKeys'
import type { CommentMode, DiffSide, PRKey } from '../types'

export type CreateThreadInput = {
  pullRequestId: string
  path: string
  line: number
  side: DiffSide
  startLine?: number
  startSide?: DiffSide
  body: string
  mode: CommentMode
  pendingReviewId?: string | null
}

export const useCreateThread = (key: PRKey) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, CreateThreadInput>({
    mutationFn: async ({
      pullRequestId,
      path,
      line,
      side,
      startLine,
      startSide,
      body,
      mode,
      pendingReviewId,
    }) => {
      if (mode === 'one-shot') {
        await createClient().request(ADD_REVIEW_THREAD_MUTATION, {
          input: {
            pullRequestId,
            event: 'COMMENT',
            threads: [{ path, line, side, startLine, startSide, body }],
          },
        })
        return
      }
      // ponytail: reuse the same pending review across a file's comments — pass its id once
      // known; the first thread of a review omits it, which is what starts the review server-side
      await createClient().request(ADD_PENDING_REVIEW_THREAD_MUTATION, {
        input: {
          ...(pendingReviewId ? { pullRequestReviewId: pendingReviewId } : { pullRequestId }),
          path,
          line,
          side,
          startLine,
          startSide,
          body,
        },
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prThreadsKey(key) }),
  })
}
