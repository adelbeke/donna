import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiffFileHeader } from './DiffFileHeader'
import type { PRFile, PRReviewThread } from '../../types'

const given_file = (overrides: Partial<PRFile> = {}): PRFile => ({
  sha: 'abc',
  filename: 'src/foo.ts',
  status: 'modified',
  additions: 3,
  deletions: 1,
  changes: 4,
  blob_url: 'https://github.com/o/r/blob/abc/src/foo.ts',
  ...overrides,
})

const given_thread = (overrides: Partial<PRReviewThread> = {}): PRReviewThread => ({
  id: 't1',
  path: 'src/foo.ts',
  line: null,
  originalLine: 3,
  startLine: null,
  originalStartLine: null,
  diffSide: 'RIGHT',
  startDiffSide: 'RIGHT',
  isResolved: false,
  isOutdated: true,
  isCollapsed: false,
  subjectType: 'LINE',
  viewerCanReply: true,
  viewerCanResolve: true,
  viewerCanUnresolve: false,
  resolvedBy: null,
  comments: {
    nodes: [
      {
        id: 'c1',
        body: 'old comment',
        createdAt: '2024-01-01T00:00:00Z',
        url: '',
        author: { login: 'alice', avatarUrl: '' },
        viewerDidAuthor: false,
      },
    ],
  },
  ...overrides,
})

describe('DiffFileHeader', () => {
  it('given a modified file, when rendered, then shows its filename and stats', () => {
    render(
      <DiffFileHeader
        file={given_file()}
        isExpanded={false}
        onToggle={vi.fn()}
        commentCount={0}
        outdatedThreads={[]}
        fileLevelThreads={[]}
      />
    )
    expect(screen.getByText('src/foo.ts')).toBeInTheDocument()
    expect(screen.getByText('+3')).toBeInTheDocument()
    expect(screen.getByText('-1')).toBeInTheDocument()
  })

  it('given a renamed file, when rendered, then shows old → new', () => {
    render(
      <DiffFileHeader
        file={given_file({ status: 'renamed', filename: 'new.ts', previous_filename: 'old.ts' })}
        isExpanded={false}
        onToggle={vi.fn()}
        commentCount={0}
        outdatedThreads={[]}
        fileLevelThreads={[]}
      />
    )
    expect(screen.getByText('old.ts → new.ts')).toBeInTheDocument()
  })

  it('given the header is clicked, then onToggle fires', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(
      <DiffFileHeader
        file={given_file()}
        isExpanded={false}
        onToggle={onToggle}
        commentCount={0}
        outdatedThreads={[]}
        fileLevelThreads={[]}
      />
    )
    await user.click(screen.getByText('src/foo.ts'))
    expect(onToggle).toHaveBeenCalled()
  })

  it('given a positive comment count, when rendered, then shows the badge', () => {
    render(
      <DiffFileHeader
        file={given_file()}
        isExpanded={false}
        onToggle={vi.fn()}
        commentCount={2}
        outdatedThreads={[]}
        fileLevelThreads={[]}
      />
    )
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('given onOpenFullFile is passed, then the button renders and fires it when clicked', async () => {
    const onOpenFullFile = vi.fn()
    const user = userEvent.setup()
    render(
      <DiffFileHeader
        file={given_file()}
        isExpanded={false}
        onToggle={vi.fn()}
        commentCount={0}
        outdatedThreads={[]}
        fileLevelThreads={[]}
        onOpenFullFile={onOpenFullFile}
      />
    )
    await user.click(screen.getByLabelText('View full file'))
    expect(onOpenFullFile).toHaveBeenCalled()
  })

  it('given onOpenFullFile is not passed, then the button is absent', () => {
    render(
      <DiffFileHeader
        file={given_file()}
        isExpanded={false}
        onToggle={vi.fn()}
        commentCount={0}
        outdatedThreads={[]}
        fileLevelThreads={[]}
      />
    )
    expect(screen.queryByLabelText('View full file')).not.toBeInTheDocument()
  })

  it('given outdated threads, when rendered, then the outdated panel is shown', () => {
    render(
      <DiffFileHeader
        file={given_file()}
        isExpanded={false}
        onToggle={vi.fn()}
        commentCount={1}
        outdatedThreads={[given_thread()]}
        fileLevelThreads={[]}
      />
    )
    expect(screen.getByText('1 outdated comment')).toBeInTheDocument()
  })
})
