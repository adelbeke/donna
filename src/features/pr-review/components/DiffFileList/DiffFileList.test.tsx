import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiffFileList } from './DiffFileList'
import { useCodeowners } from '../../queries/useCodeowners'
import { useViewerHandles } from '../../queries/useViewerHandles'
import { useCreateThread } from '../../queries/useCreateThread'
import { useReplyToThread } from '../../queries/useReplyToThread'
import { useResolveThread } from '../../queries/useResolveThread'
import type { PRFile } from '../../types'

vi.mock('../../queries/useCodeowners', () => ({ useCodeowners: vi.fn() }))
vi.mock('../../queries/useViewerHandles', () => ({ useViewerHandles: vi.fn() }))
vi.mock('../../queries/useCreateThread', () => ({ useCreateThread: vi.fn() }))
vi.mock('../../queries/useReplyToThread', () => ({ useReplyToThread: vi.fn() }))
vi.mock('../../queries/useResolveThread', () => ({ useResolveThread: vi.fn() }))

const mockUseCodeowners = vi.mocked(useCodeowners)
const mockUseViewerHandles = vi.mocked(useViewerHandles)
const mutateMock = () => ({ mutate: vi.fn(), isPending: false, isError: false }) as never

const prKey = { owner: 'o', repo: 'r', number: 1 }

const given_file = (filename: string): PRFile => ({
  sha: 'abc',
  filename,
  status: 'modified',
  additions: 1,
  deletions: 1,
  changes: 2,
  blob_url: `https://github.com/o/r/blob/abc/${filename}`,
})

beforeEach(() => {
  vi.mocked(useCreateThread).mockReturnValue(mutateMock())
  vi.mocked(useReplyToThread).mockReturnValue(mutateMock())
  vi.mocked(useResolveThread).mockReturnValue(mutateMock())
})

describe('DiffFileList', () => {
  it('given codeowners rules matching some files, when "Only my files" is toggled, then hides files the viewer does not own', async () => {
    mockUseCodeowners.mockReturnValue({
      data: [{ pattern: 'mine.ts', owners: ['@viewer'] }],
    } as never)
    mockUseViewerHandles.mockReturnValue({ data: ['@viewer'] } as never)

    const files = [given_file('src/mine.ts'), given_file('src/other.ts')]
    const user = userEvent.setup()
    render(
      <DiffFileList
        files={files}
        threads={[]}
        filesTruncated={false}
        prKey={prKey}
        pullRequestId="pr-1"
        baseRef="main"
      />
    )

    expect(screen.getByText('mine.ts')).toBeInTheDocument()
    expect(screen.getByText('other.ts')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Only my files (1)' }))

    expect(screen.getByText('mine.ts')).toBeInTheDocument()
    expect(screen.queryByText('other.ts')).not.toBeInTheDocument()
  })

  it('given no codeowners matches for the viewer, then the toggle is disabled', () => {
    mockUseCodeowners.mockReturnValue({ data: [] } as never)
    mockUseViewerHandles.mockReturnValue({ data: ['@viewer'] } as never)

    render(
      <DiffFileList
        files={[given_file('src/other.ts')]}
        threads={[]}
        filesTruncated={false}
        prKey={prKey}
        pullRequestId="pr-1"
        baseRef="main"
      />
    )

    expect(screen.getByRole('button', { name: 'Only my files (0)' })).toBeDisabled()
  })
})
