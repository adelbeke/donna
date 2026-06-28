import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PRList } from './PRList'
import type { PullRequest } from '@/types/github'

vi.mock('@/features/pull-requests/queries/useGitHubPRs', () => ({ usePullRequests: vi.fn() }))
vi.mock('@/features/pull-requests/stores/prStore', () => ({ usePRStore: vi.fn() }))
vi.mock('@/features/pull-requests/queries/useCheckContexts', () => ({
  useCheckContexts: vi.fn(() => ({ checks: [], isLoading: false })),
}))
vi.mock('@/features/pull-requests/queries/usePRDetails', () => ({
  usePRDetails: vi.fn(() => ({ data: undefined })),
}))

import { usePullRequests } from '@/features/pull-requests/queries/useGitHubPRs'
import { usePRStore } from '@/features/pull-requests/stores/prStore'
const mockUsePullRequests = vi.mocked(usePullRequests)
const mockUsePRStore = vi.mocked(usePRStore)

const makePR = (id: string, title: string): PullRequest => {
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
    additions: 0,
    deletions: 0,
    isHidden: false,
  }
}

const mockStoreFilters = () => {
  mockUsePRStore.mockImplementation((selector) =>
    selector({
      section: 'review-requested',
      globalFilters: { hiddenAuthors: [], hiddenRepos: [], showHidden: false },
      viewFilters: {
        'review-requested': { repos: [], showDrafts: false, search: '' },
        authored: { repos: [], showDrafts: false, search: '' },
        mentioned: { repos: [], showDrafts: false, search: '' },
      },
      priorityIds: [],
      hiddenIds: [],
      setSection: vi.fn(),
      setGlobalFilters: vi.fn(),
      setViewFilters: vi.fn(),
      resetFilters: vi.fn(),
      toggleHide: vi.fn(),
      togglePriority: vi.fn(),
      addHiddenAuthor: vi.fn(),
      removeHiddenAuthor: vi.fn(),
      addHiddenRepo: vi.fn(),
      removeHiddenRepo: vi.fn(),
      setView: vi.fn(),
      view: 'prs' as const,
    })
  )
}

const defaultQuery = {
  isLoading: false,
  isFetching: false,
  error: null,
  refetch: vi.fn(),
  totalCount: 0,
  loadedCount: 0,
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

  it('GIVEN totalCount > loadedCount THEN shows of {totalCount}', () => {
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
})
