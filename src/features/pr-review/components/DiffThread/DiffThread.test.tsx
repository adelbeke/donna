import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiffThread } from './DiffThread'
import type { PRReviewThread } from '../../types'

const given_thread = (overrides: Partial<PRReviewThread> = {}): PRReviewThread => ({
  id: 't1',
  path: 'src/foo.ts',
  line: 5,
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
  comments: {
    nodes: [
      {
        id: 'c1',
        body: 'nit: extract this',
        createdAt: '2024-01-01T00:00:00Z',
        url: '',
        author: { login: 'alice', avatarUrl: '' },
        viewerDidAuthor: false,
      },
    ],
  },
  ...overrides,
})

describe('DiffThread', () => {
  it('given a thread, when rendered, then shows its comments', () => {
    render(
      <DiffThread
        thread={given_thread()}
        onReply={vi.fn()}
        isReplyPending={false}
        onToggleResolve={vi.fn()}
        isResolvePending={false}
      />
    )
    expect(screen.getByText('nit: extract this')).toBeInTheDocument()
    expect(screen.getByText('alice')).toBeInTheDocument()
  })

  it('given an outdated thread, when rendered, then shows the Outdated badge', () => {
    render(
      <DiffThread
        thread={given_thread({ isOutdated: true })}
        onReply={vi.fn()}
        isReplyPending={false}
        onToggleResolve={vi.fn()}
        isResolvePending={false}
      />
    )
    expect(screen.getByText('Outdated')).toBeInTheDocument()
  })

  it('given a resolved thread, when rendered, then shows who resolved it', () => {
    render(
      <DiffThread
        thread={given_thread({ isResolved: true, resolvedBy: { login: 'bob' } })}
        onReply={vi.fn()}
        isReplyPending={false}
        onToggleResolve={vi.fn()}
        isResolvePending={false}
      />
    )
    expect(screen.getByText('Resolved by bob')).toBeInTheDocument()
  })

  it('given viewerCanReply, when a reply is submitted, then onReply is called with the body', async () => {
    const onReply = vi.fn()
    const user = userEvent.setup()
    render(
      <DiffThread
        thread={given_thread()}
        onReply={onReply}
        isReplyPending={false}
        onToggleResolve={vi.fn()}
        isResolvePending={false}
      />
    )
    await user.type(screen.getByPlaceholderText('Reply'), 'sounds good')
    await user.click(screen.getByRole('button', { name: 'Reply' }))
    expect(onReply).toHaveBeenCalledWith('sounds good')
  })

  it('given viewerCanReply is false, when rendered, then no reply composer', () => {
    render(
      <DiffThread
        thread={given_thread({ viewerCanReply: false })}
        onReply={vi.fn()}
        isReplyPending={false}
        onToggleResolve={vi.fn()}
        isResolvePending={false}
      />
    )
    expect(screen.queryByPlaceholderText('Reply')).not.toBeInTheDocument()
  })

  it('given viewerCanResolve, when the resolve button is clicked, then onToggleResolve fires', async () => {
    const onToggleResolve = vi.fn()
    const user = userEvent.setup()
    render(
      <DiffThread
        thread={given_thread()}
        onReply={vi.fn()}
        isReplyPending={false}
        onToggleResolve={onToggleResolve}
        isResolvePending={false}
      />
    )
    await user.click(screen.getByRole('button', { name: /Resolve/ }))
    expect(onToggleResolve).toHaveBeenCalled()
  })

  it('given neither viewerCanResolve nor viewerCanUnresolve, then no resolve button', () => {
    render(
      <DiffThread
        thread={given_thread({ viewerCanResolve: false, viewerCanUnresolve: false })}
        onReply={vi.fn()}
        isReplyPending={false}
        onToggleResolve={vi.fn()}
        isResolvePending={false}
      />
    )
    expect(screen.queryByRole('button', { name: /Resolve/ })).not.toBeInTheDocument()
  })
})
