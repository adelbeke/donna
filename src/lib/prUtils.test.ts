import { describe, it, expect } from 'vitest'
import type { PullRequest } from '../types/github'
import { deriveReviewerSummary } from './prUtils'

function makePR(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    id: 'pr-1',
    number: 1,
    title: 'Test PR',
    url: 'https://github.com/org/repo/pull/1',
    isDraft: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    author: { login: 'author', avatarUrl: 'https://example.com/author.png' },
    repository: { name: 'repo', nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
    reviewRequests: { nodes: [] },
    reviews: { nodes: [] },
    additions: 0,
    deletions: 0,
    ...overrides,
  }
}

describe('deriveReviewerSummary', () => {
  it('GIVEN empty reviews and requests WHEN called THEN all buckets are empty', () => {
    const pr = makePR()
    const result = deriveReviewerSummary(pr, 'author')
    expect(result.approved).toHaveLength(0)
    expect(result.changesRequested).toHaveLength(0)
    expect(result.commented).toHaveLength(0)
    expect(result.pending).toHaveLength(0)
  })

  it('GIVEN reviewer submits COMMENTED then APPROVED WHEN deduped THEN appears only in approved', () => {
    const pr = makePR({
      reviews: {
        nodes: [
          { state: 'COMMENTED', author: { login: 'bob', avatarUrl: 'https://example.com/bob.png' }, submittedAt: '2024-01-01T09:00:00Z' },
          { state: 'APPROVED', author: { login: 'bob', avatarUrl: 'https://example.com/bob.png' }, submittedAt: '2024-01-01T10:00:00Z' },
        ],
      },
    })
    const result = deriveReviewerSummary(pr, 'author')
    expect(result.approved).toHaveLength(1)
    expect(result.approved[0].login).toBe('bob')
    expect(result.commented).toHaveLength(0)
  })

  it('GIVEN reviewer login matches authorLogin WHEN called THEN author is excluded', () => {
    const pr = makePR({
      reviews: {
        nodes: [
          { state: 'APPROVED', author: { login: 'author', avatarUrl: 'https://example.com/author.png' }, submittedAt: '2024-01-01T10:00:00Z' },
        ],
      },
    })
    const result = deriveReviewerSummary(pr, 'author')
    expect(result.approved).toHaveLength(0)
  })

  it('GIVEN DISMISSED review WHEN called THEN reviewer is not placed in any bucket', () => {
    const pr = makePR({
      reviews: {
        nodes: [
          { state: 'DISMISSED', author: { login: 'carol', avatarUrl: 'https://example.com/carol.png' }, submittedAt: '2024-01-01T10:00:00Z' },
        ],
      },
    })
    const result = deriveReviewerSummary(pr, 'author')
    expect(result.approved).toHaveLength(0)
    expect(result.changesRequested).toHaveLength(0)
    expect(result.commented).toHaveLength(0)
    expect(result.pending).toHaveLength(0)
  })

  it('GIVEN PENDING review state WHEN called THEN review is ignored', () => {
    const pr = makePR({
      reviews: {
        nodes: [
          { state: 'PENDING', author: { login: 'dave', avatarUrl: 'https://example.com/dave.png' }, submittedAt: '2024-01-01T10:00:00Z' },
        ],
      },
    })
    const result = deriveReviewerSummary(pr, 'author')
    expect(result.approved).toHaveLength(0)
    expect(result.pending).toHaveLength(0)
  })

  it('GIVEN pending review request for User not in seen WHEN called THEN appears in pending', () => {
    const pr = makePR({
      reviewRequests: {
        nodes: [
          { requestedReviewer: { __typename: 'User', login: 'eve', avatarUrl: 'https://example.com/eve.png' } },
        ],
      },
    })
    const result = deriveReviewerSummary(pr, 'author')
    expect(result.pending).toHaveLength(1)
    expect(result.pending[0].login).toBe('eve')
  })

  it('GIVEN reviewer already submitted a real review WHEN pending request exists THEN not duplicated in pending', () => {
    const pr = makePR({
      reviews: {
        nodes: [
          { state: 'APPROVED', author: { login: 'frank', avatarUrl: 'https://example.com/frank.png' }, submittedAt: '2024-01-01T10:00:00Z' },
        ],
      },
      reviewRequests: {
        nodes: [
          { requestedReviewer: { __typename: 'User', login: 'frank', avatarUrl: 'https://example.com/frank.png' } },
        ],
      },
    })
    const result = deriveReviewerSummary(pr, 'author')
    expect(result.approved).toHaveLength(1)
    expect(result.pending).toHaveLength(0)
  })

  it('GIVEN DISMISSED review with pending request WHEN called THEN reviewer appears only in pending', () => {
    const pr = makePR({
      reviews: {
        nodes: [
          { state: 'DISMISSED', author: { login: 'grace', avatarUrl: 'https://example.com/grace.png' }, submittedAt: '2024-01-01T10:00:00Z' },
        ],
      },
      reviewRequests: {
        nodes: [
          { requestedReviewer: { __typename: 'User', login: 'grace', avatarUrl: 'https://example.com/grace.png' } },
        ],
      },
    })
    const result = deriveReviewerSummary(pr, 'author')
    expect(result.pending).toHaveLength(1)
    expect(result.pending[0].login).toBe('grace')
  })
})
