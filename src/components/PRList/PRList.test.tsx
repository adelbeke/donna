import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PRList from './PRList'
import type { PullRequest } from '../../types/github'

vi.mock('../../hooks/useGitHubPRs', () => ({
  usePullRequests: vi.fn(),
}))

import { usePullRequests } from '../../hooks/useGitHubPRs'
const mockUsePullRequests = vi.mocked(usePullRequests)

function makePR(id: string, title: string): PullRequest {
  return {
    id,
    number: parseInt(id, 10),
    title,
    url: `https://github.com/org/repo/pull/${id}`,
    isDraft: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    author: { login: 'user', avatarUrl: 'https://example.com/avatar.png' },
    repository: { name: 'repo', nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
    reviewRequests: { nodes: [] },
    reviews: { nodes: [] },
    additions: 0,
    deletions: 0,
    isHidden: false,
  }
}

const defaultQuery = {
  isLoading: false,
  isFetching: false,
  error: null,
  refetch: vi.fn(),
  totalCount: 0,
  loadedCount: 0,
  truncated: false,
  repos: [],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PRList', () => {
  it('GIVEN no PRs THEN shows empty state', () => {
    mockUsePullRequests.mockReturnValue({ ...defaultQuery, data: [], priorityPRs: [] } as never)
    render(<PRList />)
    expect(screen.getByText('No pull requests found.')).toBeInTheDocument()
  })

  it('GIVEN priorityPRs THEN shows Top priority heading', () => {
    const p = makePR('1', 'Priority PR')
    mockUsePullRequests.mockReturnValue({ ...defaultQuery, data: [], priorityPRs: [p], totalCount: 1, loadedCount: 1 } as never)
    render(<PRList />)
    expect(screen.getByText('Top priority')).toBeInTheDocument()
  })

  it('GIVEN no priorityPRs THEN Top priority heading absent', () => {
    const p = makePR('1', 'Regular PR')
    mockUsePullRequests.mockReturnValue({ ...defaultQuery, data: [p], priorityPRs: [], totalCount: 1, loadedCount: 1 } as never)
    render(<PRList />)
    expect(screen.queryByText('Top priority')).not.toBeInTheDocument()
  })

  it('GIVEN regular + priority PRs THEN count badge shows combined total', () => {
    const r = makePR('1', 'Regular')
    const p = makePR('2', 'Priority')
    mockUsePullRequests.mockReturnValue({ ...defaultQuery, data: [r], priorityPRs: [p], totalCount: 2, loadedCount: 2 } as never)
    render(<PRList />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('GIVEN truncated THEN shows of {totalCount}', () => {
    const prs = [makePR('1', 'PR')]
    mockUsePullRequests.mockReturnValue({ ...defaultQuery, data: prs, priorityPRs: [], totalCount: 500, loadedCount: 1 } as never)
    render(<PRList />)
    expect(screen.getByText(/of 500/)).toBeInTheDocument()
  })
})
