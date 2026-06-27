import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BranchCard } from './BranchCard/BranchCard'

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
})
