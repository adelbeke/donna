import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BranchList from './BranchList'
import type { Branch, Worktree } from '../../types/worktree'

vi.mock('@tanstack/react-query', () => ({ useQueries: vi.fn() }))
vi.mock('../../store/prStore', () => ({ usePRStore: vi.fn() }))
vi.mock('../../store/branchStore', () => ({ useBranchStore: vi.fn() }))
vi.mock('../../hooks/useGitHubPRs', () => ({ usePullRequests: vi.fn() }))

import { useQueries } from '@tanstack/react-query'
import { usePRStore } from '../../store/prStore'
import { useBranchStore } from '../../store/branchStore'
import { usePullRequests } from '../../hooks/useGitHubPRs'

const mockUseQueries = vi.mocked(useQueries)
const mockUsePRStore = vi.mocked(usePRStore)
const mockUseBranchStore = vi.mocked(useBranchStore)
const mockUsePullRequests = vi.mocked(usePullRequests)

const REPO = '/Users/me/code/donna'

function ok<T>(data: T) {
  return { data, isLoading: false, isError: false, error: null, isFetching: false, refetch: vi.fn() }
}

// useQueries is called twice in BranchList: first for branches, then for worktrees.
function mockQueries(branches: Branch[], worktrees: Worktree[]) {
  mockUseQueries
    .mockReturnValueOnce([ok(branches)] as never)
    .mockReturnValueOnce([ok(worktrees)] as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseBranchStore.mockReturnValue({
    localPaths: [REPO],
    addLocalPath: vi.fn(),
    removeLocalPath: vi.fn(),
  } as never)
  mockUsePRStore.mockReturnValue({ filters: { search: '' } } as never)
  mockUsePullRequests.mockReturnValue({ allPRs: [] } as never)
})

describe('BranchList — current branch indicator', () => {
  it('GIVEN a branch flagged isCurrent (main worktree) THEN shows the "current" badge', () => {
    mockQueries(
      [{ name: 'main', isCurrent: true }, { name: 'feat/x', isCurrent: false }],
      []
    )
    render(<BranchList />)
    expect(screen.getByText('current')).toBeInTheDocument()
  })

  it('GIVEN a branch checked out in a linked worktree (not isCurrent) THEN still shows "current"', () => {
    mockQueries(
      [{ name: 'main', isCurrent: true }, { name: 'feat/x', isCurrent: false }],
      [
        { path: REPO, branch: 'main', commit: 'aaaaaaaa', isMain: true, isDirty: false },
        { path: `${REPO}-feat-x`, branch: 'feat/x', commit: 'bbbbbbbb', isMain: false, isDirty: false },
      ]
    )
    render(<BranchList />)
    // both main (via isCurrent) and feat/x (via worktree) are current
    expect(screen.getAllByText('current')).toHaveLength(2)
  })

  it('GIVEN no current branch THEN renders no "current" badge', () => {
    mockQueries([{ name: 'feat/x', isCurrent: false }], [])
    render(<BranchList />)
    expect(screen.queryByText('current')).not.toBeInTheDocument()
  })

  it('GIVEN a current branch not first THEN it is sorted to the top of the list', () => {
    mockQueries(
      [
        { name: 'feat/a', isCurrent: false },
        { name: 'feat/b', isCurrent: false },
        { name: 'main', isCurrent: true },
      ],
      []
    )
    render(<BranchList />)
    const rendered = screen.getAllByText(/^(feat\/a|feat\/b|main)$/).map((el) => el.textContent)
    expect(rendered[0]).toBe('main')
    // non-current branches keep their original relative order
    expect(rendered).toEqual(['main', 'feat/a', 'feat/b'])
  })
})
