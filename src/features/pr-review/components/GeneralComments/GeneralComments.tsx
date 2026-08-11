import { DiffComment } from '../DiffComment/DiffComment'
import { CommentComposer } from '../CommentComposer/CommentComposer'
import { useAddComment } from '../../queries/useAddComment'
import type { PRKey, PRReviewComment } from '../../types'

type Props = {
  comments: PRReviewComment[]
  pullRequestId: string
  prKey: PRKey
}

export const GeneralComments = ({ comments, pullRequestId, prKey }: Props) => {
  const addComment = useAddComment(prKey)

  return (
    <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
      <p className="px-3 pt-3 text-xs font-medium text-[var(--color-text-secondary)]">Comments</p>
      {comments.length > 0 && (
        <div className="divide-y divide-[var(--color-border)] px-2">
          {comments.map((comment) => (
            <DiffComment key={comment.id} comment={comment} />
          ))}
        </div>
      )}
      <CommentComposer
        onSubmit={(body) => addComment.mutate({ subjectId: pullRequestId, body })}
        onCancel={() => {}}
        isPending={addComment.isPending}
        error={addComment.isError ? addComment.error.message : null}
      />
    </div>
  )
}
