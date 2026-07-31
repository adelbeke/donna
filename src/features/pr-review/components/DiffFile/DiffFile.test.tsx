import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiffFile } from './DiffFile'
import { useCreateThread } from '../../queries/useCreateThread'
import { useReplyToThread } from '../../queries/useReplyToThread'
import { useResolveThread } from '../../queries/useResolveThread'
import { useFileBlob } from '../../queries/useFileBlob'
import type { PRFile, PRReviewThread } from '../../types'

const mockUseCreateThread = vi.mocked(useCreateThread)
const mockUseReplyToThread = vi.mocked(useReplyToThread)
const mockUseResolveThread = vi.mocked(useResolveThread)
const mockUseFileBlob = vi.mocked(useFileBlob)

vi.mock('../../queries/useCreateThread', () => ({ useCreateThread: vi.fn() }))
vi.mock('../../queries/useReplyToThread', () => ({ useReplyToThread: vi.fn() }))
vi.mock('../../queries/useResolveThread', () => ({ useResolveThread: vi.fn() }))
vi.mock('../../queries/useFileBlob', () => ({ useFileBlob: vi.fn() }))

const prKey = { owner: 'o', repo: 'r', number: 1 }
const headRefOid = 'abc123'

const given_file = (overrides: Partial<PRFile> = {}): PRFile => ({
  sha: 'abc',
  filename: 'src/foo.ts',
  status: 'modified',
  additions: 1,
  deletions: 1,
  changes: 2,
  patch: '@@ -1,3 +1,3 @@\n a\n-b\n+c\n d',
  blob_url: 'https://github.com/o/r/blob/abc/src/foo.ts',
  ...overrides,
})

const given_thread = (overrides: Partial<PRReviewThread> = {}): PRReviewThread => ({
  id: 't1',
  path: 'src/foo.ts',
  line: 1,
  originalLine: null,
  startLine: null,
  originalStartLine: null,
  diffSide: 'RIGHT',
  startDiffSide: 'RIGHT',
  isResolved: false,
  isOutdated: false,
  isCollapsed: false,
  subjectType: 'LINE',
  viewerCanReply: true,
  viewerCanResolve: true,
  viewerCanUnresolve: false,
  resolvedBy: null,
  comments: { nodes: [] },
  ...overrides,
})

const mutateMock = () => ({ mutate: vi.fn(), isPending: false, isError: false }) as never

beforeEach(() => {
  mockUseCreateThread.mockReturnValue(mutateMock())
  mockUseReplyToThread.mockReturnValue(mutateMock())
  mockUseResolveThread.mockReturnValue(mutateMock())
  mockUseFileBlob.mockReturnValue({ data: undefined, isFetching: false } as never)
})

describe('DiffFile', () => {
  it('given isExpanded is false, then no diff rows are rendered', () => {
    render(
      <DiffFile
        file={given_file()}
        threads={[]}
        isExpanded={false}
        onToggle={vi.fn()}
        prKey={prKey}
        headRefOid={headRefOid}
        pullRequestId="pr-1"
      />
    )
    expect(screen.queryByText('a')).not.toBeInTheDocument()
  })

  it('given isExpanded is true, then diff rows render', () => {
    render(
      <DiffFile
        file={given_file()}
        threads={[]}
        isExpanded={true}
        onToggle={vi.fn()}
        prKey={prKey}
        headRefOid={headRefOid}
        pullRequestId="pr-1"
      />
    )
    expect(screen.getByText('c')).toBeInTheDocument()
  })

  it('given a file with no patch, when expanded, then shows the unavailable message', () => {
    render(
      <DiffFile
        file={given_file({ patch: undefined })}
        threads={[]}
        isExpanded={true}
        onToggle={vi.fn()}
        prKey={prKey}
        headRefOid={headRefOid}
        pullRequestId="pr-1"
      />
    )
    expect(screen.getByText(/Diff not available/)).toBeInTheDocument()
  })

  it('given a thread anchored on a row, when expanded, then it renders under that row', () => {
    render(
      <DiffFile
        file={given_file()}
        threads={[given_thread({ line: 1, diffSide: 'RIGHT' })]}
        isExpanded={true}
        onToggle={vi.fn()}
        prKey={prKey}
        headRefOid={headRefOid}
        pullRequestId="pr-1"
      />
    )
    expect(screen.getByRole('button', { name: /Resolve/ })).toBeInTheDocument()
  })

  it('given pullRequestId is null, then no add-comment buttons render', () => {
    render(
      <DiffFile
        file={given_file()}
        threads={[]}
        isExpanded={true}
        onToggle={vi.fn()}
        prKey={prKey}
        headRefOid={headRefOid}
        pullRequestId={null}
      />
    )
    expect(screen.queryByLabelText('Add comment')).not.toBeInTheDocument()
  })

  it('given a row add-comment button is clicked, then a composer opens for that row only', async () => {
    const user = userEvent.setup()
    render(
      <DiffFile
        file={given_file()}
        threads={[]}
        isExpanded={true}
        onToggle={vi.fn()}
        prKey={prKey}
        headRefOid={headRefOid}
        pullRequestId="pr-1"
      />
    )
    const buttons = screen.getAllByLabelText('Add comment')
    await user.click(buttons[0])
    expect(screen.getAllByPlaceholderText('Leave a comment')).toHaveLength(1)
  })

  it('given a composer is submitted, then createThread.mutate is called with the row target', async () => {
    const mutate = vi.fn()
    mockUseCreateThread.mockReturnValue({ mutate, isPending: false, isError: false } as never)
    const user = userEvent.setup()
    render(
      <DiffFile
        file={given_file()}
        threads={[]}
        isExpanded={true}
        onToggle={vi.fn()}
        prKey={prKey}
        headRefOid={headRefOid}
        pullRequestId="pr-1"
      />
    )
    const buttons = screen.getAllByLabelText('Add comment')
    await user.click(buttons[0])
    await user.type(screen.getByPlaceholderText('Leave a comment'), 'looks good')
    await user.click(screen.getByRole('button', { name: 'Comment' }))
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        pullRequestId: 'pr-1',
        path: 'src/foo.ts',
        body: 'looks good',
        mode: 'one-shot',
        pendingReviewId: null,
      }),
      expect.anything()
    )
  })

  it('given a file blob is loaded, when the full file button is clicked, then the modal shows content only present in the blob', async () => {
    mockUseFileBlob.mockReturnValue({
      data: { lines: ['a', 'c', 'd', 'lineOnlyInFullFile'] },
      isFetching: false,
    } as never)
    const user = userEvent.setup()
    render(
      <DiffFile
        file={given_file()}
        threads={[]}
        isExpanded={false}
        onToggle={vi.fn()}
        prKey={prKey}
        headRefOid={headRefOid}
        pullRequestId="pr-1"
      />
    )
    expect(screen.queryByText('lineOnlyInFullFile')).not.toBeInTheDocument()
    await user.click(screen.getByLabelText('View full file'))
    expect(screen.getByText('lineOnlyInFullFile')).toBeInTheDocument()
  })

  it('given a pending review, when a composer opens, then it is already locked to review mode with no toggle shown', async () => {
    const mutate = vi.fn()
    mockUseCreateThread.mockReturnValue({ mutate, isPending: false, isError: false } as never)
    const user = userEvent.setup()
    render(
      <DiffFile
        file={given_file()}
        threads={[]}
        isExpanded={true}
        onToggle={vi.fn()}
        prKey={prKey}
        headRefOid={headRefOid}
        pullRequestId="pr-1"
        pendingReview={{ id: 'review-1', commentCount: 2 }}
      />
    )
    const buttons = screen.getAllByLabelText('Add comment')
    await user.click(buttons[0])
    expect(screen.queryByRole('button', { name: 'Single comment' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Part of review' })).not.toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Leave a comment'), 'nit')
    await user.click(screen.getByRole('button', { name: 'Add to review' }))
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'review', pendingReviewId: 'review-1', body: 'nit' }),
      expect.anything()
    )
  })
})
