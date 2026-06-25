import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PRList } from './PRList'
import type { PullRequest } from '@/types/github'

vi.mock('@/features/pull-requests/queries/useGitHubPRs', () => ({ usePullRequests: vi.fn() }))
vi.mock('@/features/pull-requests/stores/prStore', () => ({ usePRStore: vi.fn() }))
vi.mock('./VisibilityToggles/VisibilityToggles', () => ({ VisibilityToggles: () => null }))
vi.mock('@/features/pull-requests/queries/useCheckContexts', () => ({
  useCheckContexts: vi.fn(() => ({ checks: [], isLoading: false })),
}))

import { usePullRequests } from '@/features/pull-requests/queries/useGitHubPRs'
import { usePRStore, type PRFilters } from '@/features/pull-requests/stores/prStore'
const mockUsePullRequests = vi.mocked(usePullRequests)
const mockUsePRStore = vi.mocked(usePRStore)

function makePR(id: string, title: string): PullRequest {
  return {
    id,
    number: parseInt(id, 10),
    title,
    url: `https://github.com/org/repo/pull/${id}`,
    isDraft: false,
    headRefName: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    author: { login: 'user', avatarUrl: 'https://example.com/avatar.png' },
    repository: { name: 'repo', nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
    reviewRequests: { nodes: [] },
    reviews: { nodes: [] },
    additions: 0,
    deletions: 0,
    mergeable: 'MERGEABLE',
    commits: { nodes: [] },
    isHidden: false,
  }
}

function mockStoreFilters(filterOverrides: Record<string, unknown> = {}) {
  mockUsePRStore.mockImplementation((selector) =>
    selector({
      filters: {
        section: 'review-requested',
        repos: [],
        hiddenAuthors: [],
        showDrafts: false,
        showHidden: false,
        search: '',
        ...filterOverrides,
      } as PRFilters,
      priorityIds: [],
      hiddenIds: [],
      setFilters: vi.fn(),
      resetFilters: vi.fn(),
      toggleHide: vi.fn(),
      togglePriority: vi.fn(),
      addHiddenAuthor: vi.fn(),
      removeHiddenAuthor: vi.fn(),
      setView: vi.fn(),
      view: 'prs' as const,
    })
  )
}

const defaultQuery = {
  isLoading: false,
  isFetching: false,
  isFetchingNextPage: false,
  fetchNextPage: vi.fn(),
  hasNextPage: false,
  error: null,
  refetch: vi.fn(),
  totalCount: 0,
  loadedCount: 0,
  truncated: false,
  repos: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockStoreFilters()
})

describe('PRList', () => {
  it('GIVEN no PRs THEN shows empty state', () => {
    mockUsePullRequests.mockReturnValue({ ...defaultQuery, data: [], priorityPRs: [] } as never)
    render(<PRList />)
    expect(screen.getByText('No pull requests found.')).toBeInTheDocument()
  })

  it('GIVEN priorityPRs THEN shows Top priority heading', () => {
    const p = makePR('1', 'Priority PR')
    mockUsePullRequests.mockReturnValue({
      ...defaultQuery,
      data: [],
      priorityPRs: [p],
      totalCount: 1,
      loadedCount: 1,
    } as never)
    render(<PRList />)
    expect(screen.getByText('Top priority')).toBeInTheDocument()
  })

  it('GIVEN no priorityPRs THEN Top priority heading absent', () => {
    const p = makePR('1', 'Regular PR')
    mockUsePullRequests.mockReturnValue({
      ...defaultQuery,
      data: [p],
      priorityPRs: [],
      totalCount: 1,
      loadedCount: 1,
    } as never)
    render(<PRList />)
    expect(screen.queryByText('Top priority')).not.toBeInTheDocument()
  })

  it('GIVEN regular + priority PRs THEN count badge shows combined total', () => {
    const r = makePR('1', 'Regular')
    const p = makePR('2', 'Priority')
    mockUsePullRequests.mockReturnValue({
      ...defaultQuery,
      data: [r],
      priorityPRs: [p],
      totalCount: 2,
      loadedCount: 2,
    } as never)
    render(<PRList />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('GIVEN truncated THEN shows of {totalCount}', () => {
    const prs = [makePR('1', 'PR')]
    mockUsePullRequests.mockReturnValue({
      ...defaultQuery,
      data: prs,
      priorityPRs: [],
      totalCount: 500,
      loadedCount: 1,
    } as never)
    render(<PRList />)
    expect(screen.getByText(/of 500/)).toBeInTheDocument()
  })

  describe('pagination CTAs', () => {
    it('GIVEN hasNextPage and no active filters THEN shows "Load more" only', () => {
      const prs = [makePR('1', 'PR')]
      mockUsePullRequests.mockReturnValue({
        ...defaultQuery,
        data: prs,
        priorityPRs: [],
        hasNextPage: true,
        totalCount: 100,
        loadedCount: 50,
      } as never)
      render(<PRList />)
      expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Load all' })).not.toBeInTheDocument()
      expect(screen.queryByText(/Filters apply to/)).not.toBeInTheDocument()
    })

    it('GIVEN hasNextPage=false THEN no pagination CTAs', () => {
      const prs = [makePR('1', 'PR')]
      mockUsePullRequests.mockReturnValue({
        ...defaultQuery,
        data: prs,
        priorityPRs: [],
        hasNextPage: false,
      } as never)
      render(<PRList />)
      expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Load all' })).not.toBeInTheDocument()
    })

    it('GIVEN "Load more" clicked THEN fetchNextPage is called', () => {
      const fetchNextPage = vi.fn()
      const prs = [makePR('1', 'PR')]
      mockUsePullRequests.mockReturnValue({
        ...defaultQuery,
        data: prs,
        priorityPRs: [],
        hasNextPage: true,
        fetchNextPage,
        totalCount: 100,
        loadedCount: 50,
      } as never)
      render(<PRList />)
      fireEvent.click(screen.getByRole('button', { name: 'Load more' }))
      expect(fetchNextPage).toHaveBeenCalledOnce()
    })

    it('GIVEN hasNextPage and active filter THEN shows "Load all" button', () => {
      mockStoreFilters({ repos: ['org/repo'] })
      const prs = [makePR('1', 'PR')]
      mockUsePullRequests.mockReturnValue({
        ...defaultQuery,
        data: prs,
        priorityPRs: [],
        hasNextPage: true,
        totalCount: 100,
        loadedCount: 50,
      } as never)
      render(<PRList />)
      expect(screen.getByRole('button', { name: 'Load all' })).toBeInTheDocument()
    })
  })
})
