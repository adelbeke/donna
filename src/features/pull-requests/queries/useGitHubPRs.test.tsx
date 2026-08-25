import { describe, it, expect, vi, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { sortAndPartition, deriveMyReviewState } from '../lib/prUtils'
import { usePullRequests } from './useGitHubPRs'
import { usePRStore } from '../stores/prStore'
import { useAuthStore } from '@/features/auth/stores/authStore'
import type { PullRequest } from '@/types/github'

const makePR = (id: string, createdAt: string): PullRequest => {
  return {
    id,
    number: parseInt(id, 10),
    title: `PR ${id}`,
    url: `https://github.com/org/repo/pull/${id}`,
    isDraft: false,
    headRefName: '',
    createdAt,
    updatedAt: createdAt,
    author: { login: 'user', avatarUrl: 'https://example.com/avatar.png' },
    repository: { name: 'repo', nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
    reviewRequests: { nodes: [] },
    reviews: { nodes: [] },
    additions: 10,
    deletions: 5,
    mergeable: 'MERGEABLE',
    commits: { nodes: [] },
  }
}

const old = makePR('1', '2024-01-01T00:00:00Z')
const mid = makePR('2', '2024-06-01T00:00:00Z')
const newest = makePR('3', '2024-12-01T00:00:00Z')

describe('deriveMyReviewState', () => {
  const makePRWithReviews = (
    reviews: NonNullable<PullRequest['reviews']>['nodes']
  ): PullRequest => {
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
      {
        state: 'APPROVED',
        submittedAt: '2024-01-02T00:00:00Z',
        author: { login: 'user', avatarUrl: '' },
      },
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
      {
        state: 'COMMENTED',
        submittedAt: '2024-01-01T00:00:00Z',
        author: { login: 'user', avatarUrl: '' },
      },
      {
        state: 'APPROVED',
        submittedAt: '2024-01-03T00:00:00Z',
        author: { login: 'user', avatarUrl: '' },
      },
    ])
    expect(deriveMyReviewState(pr, 'user')).toBe('APPROVED')
  })
})

describe('sortAndPartition', () => {
  describe('sort order', () => {
    it('GIVEN mixed dates THEN descending order (newest first)', () => {
      const { regular } = sortAndPartition([old, newest, mid], [])
      expect(regular.map((p) => p.id)).toEqual(['3', '2', '1'])
    })
  })

  describe('partition', () => {
    it('GIVEN a priority id WHEN partitioned THEN appears only in priorityPRs', () => {
      const { regular, priorityPRs } = sortAndPartition([old, mid, newest], ['2'])
      expect(priorityPRs.map((p) => p.id)).toEqual(['2'])
      expect(regular.map((p) => p.id)).toEqual(['3', '1'])
    })

    it('GIVEN no priority ids THEN priorityPRs is empty', () => {
      const { priorityPRs, regular } = sortAndPartition([old, newest], [])
      expect(priorityPRs).toHaveLength(0)
      expect(regular).toHaveLength(2)
    })

    it('GIVEN all priority THEN regular is empty', () => {
      const { priorityPRs, regular } = sortAndPartition([old, newest], ['1', '3'])
      expect(priorityPRs).toHaveLength(2)
      expect(regular).toHaveLength(0)
    })

    it('GIVEN priority id THEN no duplication between groups', () => {
      const { regular, priorityPRs } = sortAndPartition([old, mid, newest], ['2'])
      const allIds = [...regular.map((p) => p.id), ...priorityPRs.map((p) => p.id)]
      expect(new Set(allIds).size).toBe(allIds.length)
    })

    it('GIVEN priority ids THEN date order preserved within each group', () => {
      const { priorityPRs, regular } = sortAndPartition([old, mid, newest], ['1', '3'])
      expect(priorityPRs.map((p) => p.id)).toEqual(['3', '1'])
      expect(regular.map((p) => p.id)).toEqual(['2'])
    })
  })
})

describe('usePullRequests auto-select on new repo discovery', () => {
  const makeListPR = (id: string, repo: string): PullRequest =>
    ({
      ...makePR(id, '2024-01-01T00:00:00Z'),
      repository: { name: repo.split('/')[1], nameWithOwner: repo, url: '' },
    }) as PullRequest

  const mockSearchResponse = (repos: string[]) => ({
    data: {
      search: {
        issueCount: repos.length,
        pageInfo: { hasNextPage: false, endCursor: '' },
        nodes: repos.map((repo, i) => makeListPR(String(i), repo)),
      },
    },
  })

  const wrapper = ({ children }: { children: ReactNode }) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  afterEach(() => {
    delete window.electronAPI
    usePRStore.setState({
      section: 'review-requested',
      globalFilters: { hiddenAuthors: [], hiddenRepos: [], showHidden: false },
      viewFilters: {
        'review-requested': { repos: [], showDrafts: false, search: '' },
        authored: { repos: [], showDrafts: false, search: '' },
        reviewed: { repos: [], showDrafts: false, search: '' },
        assigned: { repos: [], showDrafts: false, search: '' },
      },
      priorityIds: [],
      hiddenIds: [],
      knownRepos: { 'review-requested': [], authored: [], reviewed: [], assigned: [] },
    })
    useAuthStore.setState({ token: null, user: null })
  })

  const setupAuth = () => {
    useAuthStore.setState({
      token: 'gh-cli',
      user: { login: 'me', avatarUrl: '', name: 'Me' },
    })
  }

  it('GIVEN org fully selected WHEN a new repo appears under it THEN auto-selects the new repo', async () => {
    setupAuth()
    usePRStore.setState({
      knownRepos: {
        'review-requested': ['acme/repo-a', 'acme/repo-b'],
        authored: [],
        reviewed: [],
        assigned: [],
      },
    })
    usePRStore.getState().setViewFilters('review-requested', {
      repos: ['acme/repo-a', 'acme/repo-b'],
    })
    const graphql = vi
      .fn()
      .mockResolvedValue(mockSearchResponse(['acme/repo-a', 'acme/repo-b', 'acme/repo-c']))
    window.electronAPI = { gh: { graphql } } as unknown as typeof window.electronAPI

    renderHook(() => usePullRequests(), { wrapper })

    await waitFor(() =>
      expect(usePRStore.getState().viewFilters['review-requested'].repos).toContain('acme/repo-c')
    )
  })

  it('GIVEN org not fully selected WHEN a new repo appears THEN does not auto-select it', async () => {
    setupAuth()
    usePRStore.setState({
      knownRepos: {
        'review-requested': ['acme/repo-a', 'acme/repo-b'],
        authored: [],
        reviewed: [],
        assigned: [],
      },
    })
    usePRStore.getState().setViewFilters('review-requested', { repos: ['acme/repo-a'] })
    const graphql = vi
      .fn()
      .mockResolvedValue(mockSearchResponse(['acme/repo-a', 'acme/repo-b', 'acme/repo-c']))
    window.electronAPI = { gh: { graphql } } as unknown as typeof window.electronAPI

    const { result } = renderHook(() => usePullRequests(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(usePRStore.getState().viewFilters['review-requested'].repos).toEqual(['acme/repo-a'])
  })

  it('GIVEN a brand-new org with no previously-known repos WHEN its first repo appears THEN does not auto-select it', async () => {
    setupAuth()
    // knownRepos stays empty (default) for review-requested
    const graphql = vi.fn().mockResolvedValue(mockSearchResponse(['newco/repo-x']))
    window.electronAPI = { gh: { graphql } } as unknown as typeof window.electronAPI

    const { result } = renderHook(() => usePullRequests(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(usePRStore.getState().viewFilters['review-requested'].repos).toEqual([])
  })

  it('GIVEN a repo hidden via globalFilters.hiddenRepos WHEN it appears THEN it is excluded from the known-repos baseline', async () => {
    setupAuth()
    usePRStore.setState({
      globalFilters: { hiddenAuthors: [], hiddenRepos: ['acme/repo-c'], showHidden: false },
      knownRepos: { 'review-requested': ['acme/repo-a'], authored: [], reviewed: [], assigned: [] },
    })
    usePRStore.getState().setViewFilters('review-requested', { repos: ['acme/repo-a'] })
    const graphql = vi.fn().mockResolvedValue(mockSearchResponse(['acme/repo-a', 'acme/repo-c']))
    window.electronAPI = { gh: { graphql } } as unknown as typeof window.electronAPI

    const { result } = renderHook(() => usePullRequests(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(usePRStore.getState().viewFilters['review-requested'].repos).toEqual(['acme/repo-a'])
    expect(usePRStore.getState().knownRepos['review-requested']).toEqual(['acme/repo-a'])
  })
})
