import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReviewActions } from './ReviewActions'
import { useSubmitReview } from '../../queries/useSubmitReview'
import { useDiscardReview } from '../../queries/useDiscardReview'
import { useAddReview } from '../../queries/useAddReview'
import { useViewer } from '@/features/pull-requests/exports'

vi.mock('../../queries/useSubmitReview', () => ({ useSubmitReview: vi.fn() }))
vi.mock('../../queries/useDiscardReview', () => ({ useDiscardReview: vi.fn() }))
vi.mock('../../queries/useAddReview', () => ({ useAddReview: vi.fn() }))
vi.mock('@/features/pull-requests/exports', () => ({ useViewer: vi.fn() }))

const mockUseSubmitReview = vi.mocked(useSubmitReview)
const mockUseDiscardReview = vi.mocked(useDiscardReview)
const mockUseAddReview = vi.mocked(useAddReview)
const mockUseViewer = vi.mocked(useViewer)
const prKey = { owner: 'o', repo: 'r', number: 1 }
const mutateMock = () => ({ mutate: vi.fn(), isPending: false, isError: false }) as never

beforeEach(() => {
  mockUseSubmitReview.mockReturnValue(mutateMock())
  mockUseDiscardReview.mockReturnValue(mutateMock())
  mockUseAddReview.mockReturnValue(mutateMock())
  mockUseViewer.mockReturnValue({ data: { login: 'reviewer', avatarUrl: '' } } as never)
})

describe('ReviewActions', () => {
  it('given the viewer authored the PR, when rendered, then shows nothing', () => {
    render(
      <ReviewActions
        prKey={prKey}
        pullRequestId="pr-1"
        prAuthorLogin="reviewer"
        pendingReview={null}
      />
    )
    expect(screen.queryByRole('button', { name: 'Review changes' })).not.toBeInTheDocument()
  })

  it('given the viewer is not yet known, when rendered, then shows nothing', () => {
    mockUseViewer.mockReturnValue({ data: undefined } as never)
    render(
      <ReviewActions
        prKey={prKey}
        pullRequestId="pr-1"
        prAuthorLogin="someone-else"
        pendingReview={null}
      />
    )
    expect(screen.queryByRole('button', { name: 'Review changes' })).not.toBeInTheDocument()
  })

  it('given no pending review, when rendered, then shows a "Review changes" button and no comment count', () => {
    render(
      <ReviewActions
        prKey={prKey}
        pullRequestId="pr-1"
        prAuthorLogin="someone-else"
        pendingReview={null}
      />
    )
    expect(screen.getByRole('button', { name: 'Review changes' })).toBeInTheDocument()
    expect(screen.queryByText(/pending comment/)).not.toBeInTheDocument()
  })

  it('given no pending review, when Review changes is submitted, then addReview.mutate fires with the PR id', async () => {
    const mutate = vi.fn((_input, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.())
    mockUseAddReview.mockReturnValue({ mutate, isPending: false, isError: false } as never)
    const user = userEvent.setup()
    render(
      <ReviewActions
        prKey={prKey}
        pullRequestId="pr-1"
        prAuthorLogin="someone-else"
        pendingReview={null}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Review changes' }))
    await user.click(screen.getByRole('radio', { name: 'Approve' }))
    await user.click(screen.getByRole('button', { name: 'Submit review' }))
    expect(mutate).toHaveBeenCalledWith(
      { pullRequestId: 'pr-1', event: 'APPROVE', body: '' },
      expect.anything()
    )
  })

  it('given a submission succeeds, then shows a confirmation instead of the button', async () => {
    const mutate = vi.fn((_input, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.())
    mockUseAddReview.mockReturnValue({ mutate, isPending: false, isError: false } as never)
    const user = userEvent.setup()
    render(
      <ReviewActions
        prKey={prKey}
        pullRequestId="pr-1"
        prAuthorLogin="someone-else"
        pendingReview={null}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Review changes' }))
    await user.click(screen.getByRole('button', { name: 'Submit review' }))
    await waitFor(() => expect(screen.getByText('Review submitted')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Review changes' })).not.toBeInTheDocument()
  })

  it('given a pending review, when rendered, then shows the comment count', () => {
    render(
      <ReviewActions
        prKey={prKey}
        pullRequestId="pr-1"
        prAuthorLogin="someone-else"
        pendingReview={{ id: 'review-1', commentCount: 3 }}
      />
    )
    expect(screen.getByText('3 pending comments')).toBeInTheDocument()
  })

  it('given a single pending comment, then the count is singular', () => {
    render(
      <ReviewActions
        prKey={prKey}
        pullRequestId="pr-1"
        prAuthorLogin="someone-else"
        pendingReview={{ id: 'review-1', commentCount: 1 }}
      />
    )
    expect(screen.getByText('1 pending comment')).toBeInTheDocument()
  })

  it('given "Finish review" clicked, then the submit modal opens', async () => {
    const user = userEvent.setup()
    render(
      <ReviewActions
        prKey={prKey}
        pullRequestId="pr-1"
        prAuthorLogin="someone-else"
        pendingReview={{ id: 'review-1', commentCount: 2 }}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Finish review' }))
    expect(screen.getByRole('button', { name: 'Submit review' })).toBeInTheDocument()
  })

  it('given a pending review and the modal open, when Submit review is clicked, then submitReview.mutate fires with the reviewId', async () => {
    const mutate = vi.fn()
    mockUseSubmitReview.mockReturnValue({ mutate, isPending: false, isError: false } as never)
    const user = userEvent.setup()
    render(
      <ReviewActions
        prKey={prKey}
        pullRequestId="pr-1"
        prAuthorLogin="someone-else"
        pendingReview={{ id: 'review-1', commentCount: 2 }}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Finish review' }))
    await user.click(screen.getByRole('radio', { name: 'Approve' }))
    await user.click(screen.getByRole('button', { name: 'Submit review' }))
    expect(mutate).toHaveBeenCalledWith(
      { reviewId: 'review-1', event: 'APPROVE', body: '' },
      expect.anything()
    )
  })

  it('given Discard is clicked and confirmed, then discardReview.mutate fires', async () => {
    const mutate = vi.fn()
    mockUseDiscardReview.mockReturnValue({ mutate, isPending: false, isError: false } as never)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(
      <ReviewActions
        prKey={prKey}
        pullRequestId="pr-1"
        prAuthorLogin="someone-else"
        pendingReview={{ id: 'review-1', commentCount: 2 }}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Discard' }))
    expect(mutate).toHaveBeenCalledWith({ reviewId: 'review-1' })
  })

  it('given Discard is clicked and not confirmed, then discardReview.mutate does not fire', async () => {
    const mutate = vi.fn()
    mockUseDiscardReview.mockReturnValue({ mutate, isPending: false, isError: false } as never)
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    render(
      <ReviewActions
        prKey={prKey}
        pullRequestId="pr-1"
        prAuthorLogin="someone-else"
        pendingReview={{ id: 'review-1', commentCount: 2 }}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Discard' }))
    expect(mutate).not.toHaveBeenCalled()
  })
})
