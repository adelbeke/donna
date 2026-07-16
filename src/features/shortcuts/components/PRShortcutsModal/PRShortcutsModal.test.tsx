import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PRShortcutsModal } from './PRShortcutsModal'
import { useShortcutStore } from '../../stores/shortcutStore'
import type { PullRequest } from '@/types/github'

const pr: PullRequest = {
  id: 'pr-1',
  number: 7,
  title: 'Fix the thing',
  url: 'https://github.com/org/repo/pull/7',
  isDraft: false,
  headRefName: 'fix-the-thing',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-02-20T12:00:00Z',
  author: { login: 'alice', avatarUrl: '' },
  repository: { name: 'repo', nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
  additions: 10,
  deletions: 2,
}

const mockRun = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  useShortcutStore.setState({ shortcuts: [] })
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  Object.defineProperty(window, 'electronAPI', {
    value: { shortcuts: { run: mockRun } },
    writable: true,
    configurable: true,
  })
})

const renderModal = () =>
  render(<PRShortcutsModal isOpen onClose={vi.fn()} pr={pr} repoPath="/Users/me/code/repo" />)

describe('PRShortcutsModal', () => {
  it('GIVEN no shortcuts WHEN rendered THEN shows empty state', () => {
    renderModal()
    expect(screen.getByText('No shortcuts defined yet')).toBeInTheDocument()
  })

  it('GIVEN run succeeds WHEN Run clicked THEN confirms, calls IPC with repoPath/PR number/body, and renders stdout', async () => {
    mockRun.mockResolvedValue({ stdout: 'ok\n', stderr: '', exitCode: 0, timedOut: false })
    useShortcutStore.getState().addShortcut({ name: 'lgtm', body: 'LGTM, tests are passing' })
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByTitle('Run'))
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Post "lgtm" as a comment on PR #7?')
    )
    expect(mockRun).toHaveBeenCalledWith('/Users/me/code/repo', 7, 'LGTM, tests are passing')
    await waitFor(() => expect(screen.getByText(/ok/)).toBeInTheDocument())
    expect(screen.getByText('exit 0')).toBeInTheDocument()
  })

  it('GIVEN run fails with non-zero exit WHEN Run clicked THEN renders stderr and failure badge', async () => {
    mockRun.mockResolvedValue({
      stdout: '',
      stderr: 'boom-failure',
      exitCode: 1,
      timedOut: false,
    })
    useShortcutStore.getState().addShortcut({ name: 'boom', body: 'this will fail' })
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByTitle('Run'))
    await waitFor(() => expect(screen.getByText('boom-failure')).toBeInTheDocument())
    expect(
      screen.getByText((_, el) => el?.tagName === 'SPAN' && el.textContent === 'exit 1')
    ).toBeInTheDocument()
  })

  it('GIVEN user cancels the confirm WHEN Run clicked THEN does not call IPC', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    useShortcutStore.getState().addShortcut({ name: 'lgtm', body: 'LGTM' })
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByTitle('Run'))
    expect(mockRun).not.toHaveBeenCalled()
  })
})
