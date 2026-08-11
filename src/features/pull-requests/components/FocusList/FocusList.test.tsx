import type { ReactElement } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FocusList } from './FocusList'
import type { PullRequest } from '@/types/github'
import type { FocusBucket } from '../../lib/focus'

vi.mock('@/features/pull-requests/queries/useFocusPRs', () => ({ useFocusPRs: vi.fn() }))
vi.mock('@/features/pull-requests/queries/useCheckContexts', () => ({
  useCheckContexts: vi.fn(() => ({ checks: [], isLoading: false, refetch: vi.fn() })),
}))
vi.mock('@/features/pull-requests/queries/usePRDetails', () => ({
  usePRDetails: vi.fn(() => ({ data: undefined })),
}))

import { useFocusPRs } from '@/features/pull-requests/queries/useFocusPRs'
const mockUseFocusPRs = vi.mocked(useFocusPRs)

const makePR = (id: string, title: string): PullRequest => ({
  id,
  number: 1,
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
})

const emptyBuckets = (): Record<FocusBucket, PullRequest[]> => ({
  'ready-to-merge': [],
  'to-review': [],
  'awaiting-my-reply': [],
})

const givenFocusState = (overrides: Partial<ReturnType<typeof useFocusPRs>> = {}) => {
  const buckets = overrides.buckets ?? emptyBuckets()
  mockUseFocusPRs.mockReturnValue({
    buckets,
    total: Object.values(buckets).reduce((sum, prs) => sum + prs.length, 0),
    isLoading: false,
    isFetching: false,
    isFetchingNextPage: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useFocusPRs>)
}

const renderList = (ui: ReactElement) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )

describe('FocusList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GIVEN every bucket is empty WHEN rendered THEN it shows the all-caught-up state', () => {
    givenFocusState()
    renderList(<FocusList />)
    expect(screen.getByText('Nothing needs you right now.')).toBeInTheDocument()
  })

  it('GIVEN PRs in several buckets WHEN rendered THEN each bucket heading and its PRs are shown', () => {
    const buckets = emptyBuckets()
    buckets['ready-to-merge'] = [makePR('1', 'Ship the thing')]
    buckets['awaiting-my-reply'] = [makePR('2', 'Answer the reviewer')]
    givenFocusState({ buckets })

    renderList(<FocusList />)

    expect(screen.getByText('Ready to merge')).toBeInTheDocument()
    expect(screen.getByText('Ball in your court')).toBeInTheDocument()
    expect(screen.getByText('Ship the thing')).toBeInTheDocument()
    expect(screen.getByText('Answer the reviewer')).toBeInTheDocument()
  })

  it('GIVEN an empty bucket WHEN others have PRs THEN the empty bucket heading is hidden', () => {
    const buckets = emptyBuckets()
    buckets['to-review'] = [makePR('1', 'Review me')]
    givenFocusState({ buckets })

    renderList(<FocusList />)

    expect(screen.getByText('Waiting for your review')).toBeInTheDocument()
    expect(screen.queryByText('Ready to merge')).not.toBeInTheDocument()
  })

  it('GIVEN buckets are populated WHEN rendered THEN they appear cheapest-to-clear first', () => {
    const buckets = emptyBuckets()
    buckets['ready-to-merge'] = [makePR('1', 'Merge me')]
    buckets['to-review'] = [makePR('2', 'Review me')]
    buckets['awaiting-my-reply'] = [makePR('3', 'Reply to me')]
    givenFocusState({ buckets })

    renderList(<FocusList />)

    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['Ready to merge', 'Waiting for your review', 'Ball in your court'])
  })

  it('GIVEN the searches fail WHEN rendered THEN the error state is shown', () => {
    givenFocusState({ error: new Error('boom') })
    renderList(<FocusList />)
    expect(screen.getByText(/Failed to load pull requests/)).toBeInTheDocument()
  })

  it('GIVEN it is still loading WHEN rendered THEN no empty state is shown', () => {
    givenFocusState({ isLoading: true })
    renderList(<FocusList />)
    expect(screen.queryByText('Nothing needs you right now.')).not.toBeInTheDocument()
  })
})
