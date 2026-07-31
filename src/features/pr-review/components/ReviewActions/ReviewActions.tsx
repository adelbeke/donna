import { useState } from 'react'
import { Check } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal.tsx'
import { useViewer } from '@/features/pull-requests/exports'
import { useSubmitReview } from '../../queries/useSubmitReview'
import { useDiscardReview } from '../../queries/useDiscardReview'
import { useAddReview } from '../../queries/useAddReview'
import type { PendingReview, PRKey, PullRequestReviewEvent } from '../../types'

const CONFIRMATION_DURATION_MS = 3000

type Props = {
  pendingReview: PendingReview | null
  pullRequestId: string
  prAuthorLogin: string | null
  prKey: PRKey
}

const EVENT_LABEL: Record<PullRequestReviewEvent, string> = {
  COMMENT: 'Comment',
  APPROVE: 'Approve',
  REQUEST_CHANGES: 'Request changes',
}

export const ReviewActions = ({ pendingReview, pullRequestId, prAuthorLogin, prKey }: Props) => {
  const [isModalOpen, setModalOpen] = useState(false)
  const [event, setEvent] = useState<PullRequestReviewEvent>('COMMENT')
  const [body, setBody] = useState('')
  const [justSubmitted, setJustSubmitted] = useState(false)
  const viewer = useViewer()
  const submitReview = useSubmitReview(prKey)
  const discardReview = useDiscardReview(prKey)
  const addReview = useAddReview(prKey)

  const mutation = pendingReview ? submitReview : addReview

  const discard = () => {
    if (!pendingReview) return
    if (window.confirm('Discard this pending review and all its comments?')) {
      discardReview.mutate({ reviewId: pendingReview.id })
    }
  }

  const onSubmitted = () => {
    setModalOpen(false)
    setBody('')
    setJustSubmitted(true)
    setTimeout(() => setJustSubmitted(false), CONFIRMATION_DURATION_MS)
  }

  const submit = () => {
    if (pendingReview) {
      submitReview.mutate({ reviewId: pendingReview.id, event, body }, { onSuccess: onSubmitted })
      return
    }
    addReview.mutate({ pullRequestId, event, body }, { onSuccess: onSubmitted })
  }

  // viewers can't approve/request-changes on their own PR — hide until we know who's asking,
  // to avoid a flash of the button before it disappears
  if (!viewer.data || viewer.data.login === prAuthorLogin) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-card-hover)] px-4 py-2">
      {justSubmitted && (
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
          <Check size={13} />
          Review submitted
        </span>
      )}
      {!justSubmitted && pendingReview && (
        <>
          <span className="text-xs text-[var(--color-text-secondary)]">
            {pendingReview.commentCount} pending comment
            {pendingReview.commentCount === 1 ? '' : 's'}
          </span>
          <button
            onClick={discard}
            disabled={discardReview.isPending}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer disabled:opacity-60"
          >
            Discard
          </button>
        </>
      )}
      {!justSubmitted && (
        <button
          onClick={() => setModalOpen(true)}
          className="text-xs px-3 py-1 rounded-full bg-[var(--color-accent)] text-white cursor-pointer"
        >
          {pendingReview ? 'Finish review' : 'Review changes'}
        </button>
      )}

      <Modal isOpen={isModalOpen} title="Submit review" onClose={() => setModalOpen(false)}>
        <div className="space-y-3 w-80">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Leave a comment (optional)"
            rows={4}
            className="w-full text-xs px-2 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
          <div className="space-y-1">
            {(Object.keys(EVENT_LABEL) as PullRequestReviewEvent[]).map((e) => (
              <label
                key={e}
                className="flex items-center gap-2 text-xs text-[var(--color-text-primary)] cursor-pointer"
              >
                <input
                  type="radio"
                  name="review-event"
                  checked={event === e}
                  onChange={() => setEvent(e)}
                />
                {EVENT_LABEL[e]}
              </label>
            ))}
          </div>
          {mutation.isError && (
            <p className="text-xs text-[var(--color-danger)]">{mutation.error.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setModalOpen(false)}
              className="text-xs px-2 py-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={mutation.isPending}
              className="text-xs px-3 py-1 rounded bg-[var(--color-accent)] text-white cursor-pointer disabled:opacity-50"
            >
              {mutation.isPending ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
