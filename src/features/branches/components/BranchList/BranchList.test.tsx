import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BranchCard } from './BranchCard/BranchCard'
import { BranchList } from './BranchList'
import type { Branch, Worktree } from '../../types'

vi.mock('@tanstack/react-query', () => ({ useQueries: vi.fn() }))
vi.mock('../../stores/branchStore', () => ({ useBranchStore: vi.fn() }))
vi.mock('@/features/pull-requests/exports', () => ({ usePullRequests: vi.fn() }))

import { useQueries } from '@tanstack/react-query'
import { useBranchStore } from '../../stores/branchStore'
import { usePullRequests } from '@/features/pull-requests/exports'

const mockUseQueries = vi.mocked(useQueries)
const mockUseBranchStore = vi.mocked(useBranchStore)
const mockUsePullRequests = vi.mocked(usePullRequests)

const REPO = '/Users/me/code/donna'

const ok = <T,>(data: T) => ({
  data,
  isLoading: false,
  isError: false,
  error: null,
  isFetching: false,
  refetch: vi.fn(),
})

const mockDelete = vi.fn().mockResolvedValue(undefined)
const mockSwitchToDefault = vi.fn().mockResolvedValue(undefined)
const mockRemove = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  Object.defineProperty(window, 'electronAPI', {
    value: {
      branches: { delete: mockDelete, switchToDefault: mockSwitchToDefault },
      worktrees: { remove: mockRemove },
    },
    writable: true,
    configurable: true,
  })
})

const card = (overrides: Partial<Parameters<typeof BranchCard>[0]> = {}) => {
  const onDeleted = vi.fn()
  render(
    <BranchCard
      branch="feat/my-feature"
      repo="my-repo"
      repoPath="/repos/my-repo"
      hue={210}
      isCurrentBranch={false}
      onDeleted={onDeleted}
      {...overrides}
    />
  )
  return { onDeleted }
}

describe('BranchList — current branch sorting', () => {
  const mockQueries = (branches: Branch[], worktrees: Worktree[]) => {
    mockUseQueries
      .mockReturnValueOnce([ok(branches)] as never)
      .mockReturnValueOnce([ok(worktrees)] as never)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'electronAPI', {
      value: {
        branches: { list: vi.fn(), delete: vi.fn(), switchToDefault: vi.fn() },
        worktrees: { list: vi.fn(), remove: vi.fn() },
        dirs: { filterExisting: vi.fn().mockResolvedValue([REPO]) },
        dialog: { openDirectory: vi.fn() },
      },
      writable: true,
      configurable: true,
    })
    mockUseBranchStore.mockReturnValue({
      localPaths: [REPO],
      addLocalPath: vi.fn(),
      removeLocalPath: vi.fn(),
      branchSearch: '',
    } as never)
    mockUsePullRequests.mockReturnValue({ allPRs: [] } as never)
  })

  it('GIVEN current branch is not first THEN it is sorted to the top', () => {
    mockQueries(
      [
        { name: 'feat/a', isCurrent: false },
        { name: 'feat/b', isCurrent: false },
        { name: 'main', isCurrent: true },
      ],
      []
    )
    render(<BranchList />)
    const names = screen.getAllByText(/^(feat\/a|feat\/b|main)$/).map((el) => el.textContent)
    expect(names[0]).toBe('main')
    expect(names).toEqual(['main', 'feat/a', 'feat/b'])
  })

  it('GIVEN branch checked out in linked worktree THEN it is NOT highlighted and does not float up', () => {
    mockQueries(
      [
        { name: 'feat/x', isCurrent: false },
        { name: 'main', isCurrent: true },
      ],
      [
        { path: REPO, branch: 'main', commit: 'aaa', isMain: true, isDirty: false },
        { path: `${REPO}-feat-x`, branch: 'feat/x', commit: 'bbb', isMain: false, isDirty: false },
      ]
    )
    render(<BranchList />)
    const names = screen.getAllByText(/^(feat\/x|main)$/).map((el) => el.textContent)
    // main floats to top; feat/x has a worktree badge but is not treated as current
    expect(names[0]).toBe('main')
    expect(names).toEqual(['main', 'feat/x'])
  })
})

describe('BranchCard — protected branches', () => {
  it('GIVEN branch is main WHEN rendered THEN no more-actions button', () => {
    card({ branch: 'main' })
    expect(screen.queryByTitle('More actions')).not.toBeInTheDocument()
  })

  it('GIVEN branch is master WHEN rendered THEN no more-actions button', () => {
    card({ branch: 'master' })
    expect(screen.queryByTitle('More actions')).not.toBeInTheDocument()
  })
})

describe('BranchCard — regular branch', () => {
  it('WHEN rendered THEN more-actions button is visible', () => {
    card()
    expect(screen.getByTitle('More actions')).toBeInTheDocument()
  })

  it('WHEN more-actions clicked THEN shows Delete branch option', async () => {
    const user = userEvent.setup()
    card()
    await user.click(screen.getByTitle('More actions'))
    expect(screen.getByText('Delete branch')).toBeInTheDocument()
  })

  it('GIVEN user confirms WHEN Delete branch clicked THEN calls branches.delete', async () => {
    const user = userEvent.setup()
    const { onDeleted } = card()
    await user.click(screen.getByTitle('More actions'))
    await user.click(screen.getByText('Delete branch'))
    expect(mockDelete).toHaveBeenCalledWith('/repos/my-repo', 'feat/my-feature')
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
  })

  it('GIVEN user cancels WHEN Delete branch clicked THEN does not call branches.delete', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    card()
    await user.click(screen.getByTitle('More actions'))
    await user.click(screen.getByText('Delete branch'))
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('GIVEN delete fails WHEN Delete branch clicked THEN shows error inline', async () => {
    mockDelete.mockRejectedValueOnce(new Error('branch not fully merged'))
    const user = userEvent.setup()
    card()
    await user.click(screen.getByTitle('More actions'))
    await user.click(screen.getByText('Delete branch'))
    await waitFor(() => expect(screen.getByText('branch not fully merged')).toBeInTheDocument())
  })
})

describe('BranchCard — current branch', () => {
  it('WHEN more-actions clicked THEN confirm message mentions switching to main', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    card({ isCurrentBranch: true })
    await user.click(screen.getByTitle('More actions'))
    await user.click(screen.getByText('Delete branch'))
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('switch to main'))
  })

  it('GIVEN user confirms WHEN Delete branch clicked THEN calls switchToDefault then delete', async () => {
    const user = userEvent.setup()
    const { onDeleted } = card({ isCurrentBranch: true })
    await user.click(screen.getByTitle('More actions'))
    await user.click(screen.getByText('Delete branch'))
    expect(mockSwitchToDefault).toHaveBeenCalledWith('/repos/my-repo')
    expect(mockDelete).toHaveBeenCalledWith('/repos/my-repo', 'feat/my-feature')
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
  })
})

describe('BranchCard — worktree branch', () => {
  const worktree = {
    path: '/repos/my-repo-wt',
    branch: 'feat/my-feature',
    commit: 'abc123',
    isMain: false,
    isDirty: false,
  }

  it('WHEN more-actions clicked THEN shows Remove worktree, not Delete branch', async () => {
    const user = userEvent.setup()
    card({ worktree })
    await user.click(screen.getByTitle('More actions'))
    expect(screen.getByText('Remove worktree')).toBeInTheDocument()
    expect(screen.queryByText('Delete branch')).not.toBeInTheDocument()
  })

  it('GIVEN user confirms WHEN Remove worktree clicked THEN calls worktrees.remove with force=false', async () => {
    const user = userEvent.setup()
    const { onDeleted } = card({ worktree })
    await user.click(screen.getByTitle('More actions'))
    await user.click(screen.getByText('Remove worktree'))
    expect(mockRemove).toHaveBeenCalledWith('/repos/my-repo', '/repos/my-repo-wt', false)
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
  })

  it('GIVEN dirty worktree WHEN more-actions clicked THEN confirm message warns about lost changes', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    card({ worktree: { ...worktree, isDirty: true } })
    await user.click(screen.getByTitle('More actions'))
    await user.click(screen.getByText('Remove worktree'))
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('uncommitted changes'))
  })

  it('GIVEN dirty worktree WHEN user confirms THEN calls worktrees.remove with force=true', async () => {
    const user = userEvent.setup()
    const { onDeleted } = card({ worktree: { ...worktree, isDirty: true } })
    await user.click(screen.getByTitle('More actions'))
    await user.click(screen.getByText('Remove worktree'))
    expect(mockRemove).toHaveBeenCalledWith('/repos/my-repo', '/repos/my-repo-wt', true)
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
  })

  it('GIVEN clean-looking worktree that is actually dirty WHEN remove fails with modified-files error THEN auto-retries with force=true and calls onDeleted', async () => {
    mockRemove.mockRejectedValueOnce(
      new Error(
        "fatal: '/repos/my-repo-wt' contains modified or untracked files, use --force to delete it"
      )
    )
    const user = userEvent.setup()
    const { onDeleted } = card({ worktree })
    await user.click(screen.getByTitle('More actions'))
    await user.click(screen.getByText('Remove worktree'))
    await waitFor(() => expect(mockRemove).toHaveBeenCalledTimes(2))
    expect(mockRemove).toHaveBeenNthCalledWith(1, '/repos/my-repo', '/repos/my-repo-wt', false)
    expect(mockRemove).toHaveBeenNthCalledWith(2, '/repos/my-repo', '/repos/my-repo-wt', true)
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
  })

  it('GIVEN remove fails with an unrelated error WHEN Remove worktree clicked THEN shows the error inline and does not retry', async () => {
    mockRemove.mockRejectedValueOnce(new Error('worktree is locked'))
    const user = userEvent.setup()
    card({ worktree })
    await user.click(screen.getByTitle('More actions'))
    await user.click(screen.getByText('Remove worktree'))
    await waitFor(() => expect(screen.getByText('worktree is locked')).toBeInTheDocument())
    expect(mockRemove).toHaveBeenCalledTimes(1)
  })

  it('GIVEN worktree removal is slow WHEN Remove worktree clicked THEN the trigger is disabled until it settles, preventing a duplicate command', async () => {
    let resolveRemove: () => void
    mockRemove.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveRemove = resolve
      })
    )
    const user = userEvent.setup()
    const { onDeleted } = card({ worktree })
    await user.click(screen.getByTitle('More actions'))
    await user.click(screen.getByText('Remove worktree'))

    expect(screen.getByTitle('Removing worktree…')).toBeDisabled()
    await user.click(screen.getByTitle('Removing worktree…'))
    expect(screen.queryByText('Remove worktree')).not.toBeInTheDocument()
    expect(mockRemove).toHaveBeenCalledTimes(1)

    resolveRemove!()
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
    expect(screen.getByTitle('More actions')).not.toBeDisabled()
  })
})
