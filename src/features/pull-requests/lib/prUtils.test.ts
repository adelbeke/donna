import { describe, it, expect } from 'vitest'
import type { PullRequest } from '@/types/github'
import { deriveReviewerSummary, buildSearchQuery, deriveCheckState } from './prUtils'

const makePR = (overrides: Partial<PullRequest> = {}): PullRequest => {
  return {
    id: 'pr-1',
    number: 1,
    title: 'Test PR',
    url: 'https://github.com/org/repo/pull/1',
    isDraft: false,
    headRefName: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    author: { login: 'author', avatarUrl: 'https://example.com/author.png' },
    repository: { name: 'repo', nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
    reviewRequests: { nodes: [] },
    reviews: { nodes: [] },
    additions: 0,
    deletions: 0,
    mergeable: 'MERGEABLE',
    commits: { nodes: [] },
    ...overrides,
  }
}

describe('buildSearchQuery', () => {
  it('GIVEN review-requested section WHEN called THEN includes review-requested filter', () => {
    const actual = buildSearchQuery('review-requested', 'alice')
    expect(actual).toContain('review-requested:alice')
    expect(actual).toContain('is:open is:pr archived:false')
  })

  it('GIVEN authored section WHEN called THEN includes author filter', () => {
    const actual = buildSearchQuery('authored', 'alice')
    expect(actual).toContain('author:alice')
  })

  it('GIVEN mentioned section WHEN called THEN includes mentions filter', () => {
    const actual = buildSearchQuery('mentioned', 'alice')
    expect(actual).toContain('mentions:alice')
  })

  it('GIVEN unknown section WHEN called THEN falls back to review-requested', () => {
    const actual = buildSearchQuery('unknown', 'alice')
    expect(actual).toContain('review-requested:alice')
  })
})

describe('deriveCheckState', () => {
  it('GIVEN PR with no commits WHEN called THEN returns null', () => {
    const pr = makePR({ commits: { nodes: [] } })
    expect(deriveCheckState(pr)).toBeNull()
  })

  it('GIVEN PR with null statusCheckRollup WHEN called THEN returns null', () => {
    const pr = makePR({
      commits: { nodes: [{ commit: { statusCheckRollup: null } }] },
    })
    expect(deriveCheckState(pr)).toBeNull()
  })

  it('GIVEN PR with SUCCESS rollup WHEN called THEN returns SUCCESS', () => {
    const pr = makePR({
      commits: {
        nodes: [
          {
            commit: {
              statusCheckRollup: { state: 'SUCCESS', contexts: { nodes: [] } },
            },
          },
        ],
      },
    })
    expect(deriveCheckState(pr)).toBe('SUCCESS')
  })

  it('GIVEN PR with FAILURE rollup WHEN called THEN returns FAILURE', () => {
    const pr = makePR({
      commits: {
        nodes: [
          {
            commit: {
              statusCheckRollup: { state: 'FAILURE', contexts: { nodes: [] } },
            },
          },
        ],
      },
    })
    expect(deriveCheckState(pr)).toBe('FAILURE')
  })
})

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
          {
            state: 'COMMENTED',
            author: { login: 'bob', avatarUrl: 'https://example.com/bob.png' },
            submittedAt: '2024-01-01T09:00:00Z',
          },
          {
            state: 'APPROVED',
            author: { login: 'bob', avatarUrl: 'https://example.com/bob.png' },
            submittedAt: '2024-01-01T10:00:00Z',
          },
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
          {
            state: 'APPROVED',
            author: { login: 'author', avatarUrl: 'https://example.com/author.png' },
            submittedAt: '2024-01-01T10:00:00Z',
          },
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
          {
            state: 'DISMISSED',
            author: { login: 'carol', avatarUrl: 'https://example.com/carol.png' },
            submittedAt: '2024-01-01T10:00:00Z',
          },
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
          {
            state: 'PENDING',
            author: { login: 'dave', avatarUrl: 'https://example.com/dave.png' },
            submittedAt: '2024-01-01T10:00:00Z',
          },
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
          {
            requestedReviewer: {
              __typename: 'User',
              login: 'eve',
              avatarUrl: 'https://example.com/eve.png',
            },
          },
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
          {
            state: 'APPROVED',
            author: { login: 'frank', avatarUrl: 'https://example.com/frank.png' },
            submittedAt: '2024-01-01T10:00:00Z',
          },
        ],
      },
      reviewRequests: {
        nodes: [
          {
            requestedReviewer: {
              __typename: 'User',
              login: 'frank',
              avatarUrl: 'https://example.com/frank.png',
            },
          },
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
          {
            state: 'DISMISSED',
            author: { login: 'grace', avatarUrl: 'https://example.com/grace.png' },
            submittedAt: '2024-01-01T10:00:00Z',
          },
        ],
      },
      reviewRequests: {
        nodes: [
          {
            requestedReviewer: {
              __typename: 'User',
              login: 'grace',
              avatarUrl: 'https://example.com/grace.png',
            },
          },
        ],
      },
    })
    const result = deriveReviewerSummary(pr, 'author')
    expect(result.pending).toHaveLength(1)
    expect(result.pending[0].login).toBe('grace')
  })
})
