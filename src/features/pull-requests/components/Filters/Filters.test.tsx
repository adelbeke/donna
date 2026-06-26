import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Filters } from './Filters'
import { usePullRequests } from '../../queries/useGitHubPRs'
import { usePRStore, type PRFilters } from '../../stores/prStore'

vi.mock('../../queries/useGitHubPRs', () => ({ usePullRequests: vi.fn() }))
vi.mock('../../stores/prStore', () => ({ usePRStore: vi.fn() }))
const mockUsePullRequests = vi.mocked(usePullRequests)
const mockUsePRStore = vi.mocked(usePRStore)

const defaultQuery = {
  isLoading: false,
  isFetching: false,
  hasNextPage: true,
  truncated: false,
  loadedCount: 50,
  totalCount: 100,
  repos: [],
}

function mockStore(filterOverrides: Partial<PRFilters> = {}) {
  const state = {
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
  }
  mockUsePRStore.mockImplementation((selector?: (s: typeof state) => unknown) =>
    selector ? selector(state) : state
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUsePullRequests.mockReturnValue(defaultQuery as never)
  mockStore()
})

describe('Filters — pagination warning', () => {
  it('GIVEN only muted authors active THEN warning is absent', () => {
    mockStore({ hiddenAuthors: ['renovate', 'dependabot'] })
    render(<Filters />)
    expect(screen.queryByText(/Filters apply to/)).not.toBeInTheDocument()
  })

  it('GIVEN repo filter selected THEN warning is present', () => {
    mockStore({ repos: ['org/repo'] })
    render(<Filters />)
    expect(screen.getByText(/Filters apply to/)).toBeInTheDocument()
  })

  it('GIVEN showDrafts active THEN warning is present', () => {
    mockStore({ showDrafts: true })
    render(<Filters />)
    expect(screen.getByText(/Filters apply to/)).toBeInTheDocument()
  })

  it('GIVEN showHidden active THEN warning is present', () => {
    mockStore({ showHidden: true })
    render(<Filters />)
    expect(screen.getByText(/Filters apply to/)).toBeInTheDocument()
  })

  it('GIVEN no additive filters and no next page THEN warning is absent', () => {
    mockUsePullRequests.mockReturnValue({ ...defaultQuery, hasNextPage: false } as never)
    mockStore({ repos: ['org/repo'] })
    render(<Filters />)
    expect(screen.queryByText(/Filters apply to/)).not.toBeInTheDocument()
  })
})
