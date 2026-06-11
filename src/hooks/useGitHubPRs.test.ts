import { describe, it, expect } from 'vitest'
import { sortAndPartition, deriveMyReviewState } from './useGitHubPRs'
import type { PullRequest } from '../types/github'

function makePR(id: string, createdAt: string): PullRequest {
  return {
    id,
    number: parseInt(id, 10),
    title: `PR ${id}`,
    url: `https://github.com/org/repo/pull/${id}`,
    isDraft: false,
    createdAt,
    updatedAt: createdAt,
    author: { login: 'user', avatarUrl: 'https://example.com/avatar.png' },
    repository: { name: 'repo', nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
    reviewRequests: { nodes: [] },
    reviews: { nodes: [] },
    additions: 10,
    deletions: 5,
  }
}

const old = makePR('1', '2024-01-01T00:00:00Z')
const mid = makePR('2', '2024-06-01T00:00:00Z')
const newest = makePR('3', '2024-12-01T00:00:00Z')

describe('deriveMyReviewState', () => {
  function makePRWithReviews(reviews: PullRequest['reviews']['nodes']): PullRequest {
    return { ...makePR('1', '2024-01-01T00:00:00Z'), reviews: { nodes: reviews } }
  }

  it('GIVEN review with null author WHEN filtering THEN does not crash', () => {
    const pr = makePRWithReviews([
      { state: 'APPROVED', submittedAt: '2024-01-01T00:00:00Z', author: null },
    ])
    const actual = deriveMyReviewState(pr, 'user')
    expect(actual).toBeNull()
  })

  it('GIVEN mix of null and real author WHEN filtering THEN returns real author state', () => {
    const pr = makePRWithReviews([
      { state: 'COMMENTED', submittedAt: '2024-01-01T00:00:00Z', author: null },
      { state: 'APPROVED', submittedAt: '2024-01-02T00:00:00Z', author: { login: 'user', avatarUrl: '' } },
    ])
    const actual = deriveMyReviewState(pr, 'user')
    expect(actual).toBe('APPROVED')
  })

  it('GIVEN no reviews THEN returns null', () => {
    const pr = makePRWithReviews([])
    expect(deriveMyReviewState(pr, 'user')).toBeNull()
  })

  it('GIVEN multiple reviews by same user THEN returns most recent', () => {
    const pr = makePRWithReviews([
      { state: 'COMMENTED', submittedAt: '2024-01-01T00:00:00Z', author: { login: 'user', avatarUrl: '' } },
      { state: 'APPROVED', submittedAt: '2024-01-03T00:00:00Z', author: { login: 'user', avatarUrl: '' } },
    ])
    expect(deriveMyReviewState(pr, 'user')).toBe('APPROVED')
  })
})

describe('sortAndPartition', () => {
  describe('sort order', () => {
    it('GIVEN mixed dates WHEN newest THEN descending order', () => {
      const { regular } = sortAndPartition([old, newest, mid], [], 'newest')
      expect(regular.map((p) => p.id)).toEqual(['3', '2', '1'])
    })

    it('GIVEN mixed dates WHEN oldest THEN ascending order', () => {
      const { regular } = sortAndPartition([newest, old, mid], [], 'oldest')
      expect(regular.map((p) => p.id)).toEqual(['1', '2', '3'])
    })
  })

  describe('partition', () => {
    it('GIVEN a priority id WHEN partitioned THEN appears only in priorityPRs', () => {
      const { regular, priorityPRs } = sortAndPartition([old, mid, newest], ['2'], 'newest')
      expect(priorityPRs.map((p) => p.id)).toEqual(['2'])
      expect(regular.map((p) => p.id)).toEqual(['3', '1'])
    })

    it('GIVEN no priority ids THEN priorityPRs is empty', () => {
      const { priorityPRs, regular } = sortAndPartition([old, newest], [], 'newest')
      expect(priorityPRs).toHaveLength(0)
      expect(regular).toHaveLength(2)
    })

    it('GIVEN all priority THEN regular is empty', () => {
      const { priorityPRs, regular } = sortAndPartition([old, newest], ['1', '3'], 'newest')
      expect(priorityPRs).toHaveLength(2)
      expect(regular).toHaveLength(0)
    })

    it('GIVEN priority id THEN no duplication between groups', () => {
      const { regular, priorityPRs } = sortAndPartition([old, mid, newest], ['2'], 'newest')
      const allIds = [...regular.map((p) => p.id), ...priorityPRs.map((p) => p.id)]
      expect(new Set(allIds).size).toBe(allIds.length)
    })

    it('GIVEN priority ids THEN date order preserved within each group', () => {
      const { priorityPRs, regular } = sortAndPartition([old, mid, newest], ['1', '3'], 'newest')
      expect(priorityPRs.map((p) => p.id)).toEqual(['3', '1'])
      expect(regular.map((p) => p.id)).toEqual(['2'])
    })
  })
})
