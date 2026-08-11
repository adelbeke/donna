import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GeneralComments } from './GeneralComments'
import { useAddComment } from '../../queries/useAddComment'
import type { PRReviewComment } from '../../types'

vi.mock('../../queries/useAddComment', () => ({ useAddComment: vi.fn() }))

const mockUseAddComment = vi.mocked(useAddComment)
const prKey = { owner: 'o', repo: 'r', number: 1 }

const given_comment = (overrides: Partial<PRReviewComment> = {}): PRReviewComment => ({
  id: 'c1',
  body: 'hello',
  createdAt: '2024-01-01T00:00:00Z',
  url: 'https://github.com/o/r/pull/1#issuecomment-1',
  author: { login: 'octocat', avatarUrl: 'https://example.com/a.png' },
  viewerDidAuthor: false,
  ...overrides,
})

beforeEach(() => {
  mockUseAddComment.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false } as never)
})

describe('GeneralComments', () => {
  it('given existing comments, when rendered, then each comment body shows', () => {
    render(
      <GeneralComments
        comments={[given_comment({ body: 'first' }), given_comment({ id: 'c2', body: 'second' })]}
        pullRequestId="pr-1"
        prKey={prKey}
      />
    )
    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.getByText('second')).toBeInTheDocument()
  })

  it('given text submitted, then addComment.mutate is called with the PR id and body', async () => {
    const mutate = vi.fn()
    mockUseAddComment.mockReturnValue({ mutate, isPending: false, isError: false } as never)
    const user = userEvent.setup()
    render(<GeneralComments comments={[]} pullRequestId="pr-1" prKey={prKey} />)
    await user.type(screen.getByPlaceholderText('Leave a comment'), 'nice work')
    await user.click(screen.getByRole('button', { name: 'Comment' }))
    expect(mutate).toHaveBeenCalledWith({ subjectId: 'pr-1', body: 'nice work' })
  })
})
