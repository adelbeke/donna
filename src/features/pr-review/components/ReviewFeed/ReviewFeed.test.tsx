import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReviewFeed } from './ReviewFeed'
import type { PRReview } from '../../types'

const given_review = (overrides: Partial<PRReview> = {}): PRReview => ({
  id: 'r1',
  state: 'APPROVED',
  body: '',
  submittedAt: '2024-01-01T00:00:00Z',
  author: { login: 'octocat', avatarUrl: 'https://example.com/a.png' },
  viewerDidAuthor: false,
  ...overrides,
})

describe('ReviewFeed', () => {
  it('given no reviews, when rendered, then renders nothing', () => {
    const { container } = render(<ReviewFeed reviews={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('given an approved review, when rendered, then shows the author and state', () => {
    render(<ReviewFeed reviews={[given_review({ state: 'APPROVED' })]} />)
    expect(screen.getByText('octocat')).toBeInTheDocument()
    expect(screen.getByText('approved')).toBeInTheDocument()
  })

  it('given a changes-requested review with a body, when rendered, then shows the label and comment', () => {
    render(
      <ReviewFeed
        reviews={[given_review({ state: 'CHANGES_REQUESTED', body: 'please fix the typo' })]}
      />
    )
    expect(screen.getByText('requested changes')).toBeInTheDocument()
    expect(screen.getByText('please fix the typo')).toBeInTheDocument()
  })
})
