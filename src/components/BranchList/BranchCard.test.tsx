import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BranchCard } from './BranchList'
import * as useDeleteBranchModule from '../../hooks/useDeleteBranch'
import type { Branch } from '../../types/github'

const mockMutate = vi.fn()

function mockHook(overrides: Partial<ReturnType<typeof useDeleteBranchModule.useDeleteBranch>> = {}) {
  vi.spyOn(useDeleteBranchModule, 'useDeleteBranch').mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useDeleteBranchModule.useDeleteBranch>)
  if (Object.keys(overrides).length) {
    vi.spyOn(useDeleteBranchModule, 'useDeleteBranch').mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      ...overrides,
    } as unknown as ReturnType<typeof useDeleteBranchModule.useDeleteBranch>)
  }
}

const branch: Branch = {
  name: 'feat-x',
  repo: 'org/repo',
  lastCommitDate: '2024-01-01T00:00:00Z',
  linkedPr: null,
}

beforeEach(() => {
  mockMutate.mockReset()
  mockHook()
})

describe('BranchCard', () => {
  it('GIVEN a branch WHEN rendered THEN shows trash button', () => {
    render(<BranchCard branch={branch} />)
    expect(screen.getByTitle('Delete branch')).toBeInTheDocument()
  })

  it('GIVEN trash clicked WHEN confirming THEN shows confirm UI', async () => {
    const user = userEvent.setup()
    render(<BranchCard branch={branch} />)
    await user.click(screen.getByTitle('Delete branch'))
    expect(screen.getByText('Delete branch?')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('GIVEN cancel clicked WHEN confirming THEN reverts to default state', async () => {
    const user = userEvent.setup()
    render(<BranchCard branch={branch} />)
    await user.click(screen.getByTitle('Delete branch'))
    await user.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Delete branch?')).not.toBeInTheDocument()
    expect(screen.getByTitle('Delete branch')).toBeInTheDocument()
  })

  it('GIVEN branch has open PR WHEN confirming THEN warns about it', async () => {
    const user = userEvent.setup()
    const branchWithPr: Branch = { ...branch, linkedPr: { number: 42, state: 'OPEN', url: 'https://github.com/org/repo/pull/42' } }
    render(<BranchCard branch={branchWithPr} />)
    await user.click(screen.getByTitle('Delete branch'))
    expect(screen.getByText('Has open PR #42')).toBeInTheDocument()
  })

  it('GIVEN confirm clicked WHEN deleting THEN calls mutate with correct args', async () => {
    const user = userEvent.setup()
    render(<BranchCard branch={branch} />)
    await user.click(screen.getByTitle('Delete branch'))
    await user.click(screen.getByText('Delete'))
    expect(mockMutate).toHaveBeenCalledWith(
      { repo: 'org/repo', name: 'feat-x' },
      expect.objectContaining({ onSettled: expect.any(Function) })
    )
  })

  it('GIVEN delete fails WHEN rendered THEN shows error message', () => {
    mockHook({ isError: true })
    render(<BranchCard branch={branch} />)
    expect(screen.getByText('Delete failed. Try again.')).toBeInTheDocument()
  })
})
