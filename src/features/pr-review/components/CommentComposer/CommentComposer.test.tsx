import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentComposer } from './CommentComposer'

describe('CommentComposer', () => {
  it('given an empty body, when rendered, then submit is disabled', () => {
    render(<CommentComposer onSubmit={vi.fn()} onCancel={vi.fn()} isPending={false} />)
    expect(screen.getByRole('button', { name: 'Comment' })).toBeDisabled()
  })

  it('given whitespace-only text, when typed, then submit stays disabled', async () => {
    const user = userEvent.setup()
    render(<CommentComposer onSubmit={vi.fn()} onCancel={vi.fn()} isPending={false} />)
    await user.type(screen.getByPlaceholderText('Leave a comment'), '   ')
    expect(screen.getByRole('button', { name: 'Comment' })).toBeDisabled()
  })

  it('given text typed, when submit is clicked, then onSubmit receives the trimmed body', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<CommentComposer onSubmit={onSubmit} onCancel={vi.fn()} isPending={false} />)
    await user.type(screen.getByPlaceholderText('Leave a comment'), '  nit: fix this  ')
    await user.click(screen.getByRole('button', { name: 'Comment' }))
    expect(onSubmit).toHaveBeenCalledWith('nit: fix this')
  })

  it('given Cmd+Enter pressed, when text is present, then submits', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<CommentComposer onSubmit={onSubmit} onCancel={vi.fn()} isPending={false} />)
    const textarea = screen.getByPlaceholderText('Leave a comment')
    await user.type(textarea, 'quick reply')
    await user.keyboard('{Meta>}{Enter}{/Meta}')
    expect(onSubmit).toHaveBeenCalledWith('quick reply')
  })

  it('given Escape pressed, then onCancel fires', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(<CommentComposer onSubmit={vi.fn()} onCancel={onCancel} isPending={false} />)
    await user.type(screen.getByPlaceholderText('Leave a comment'), 'x')
    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalled()
  })

  it('given isPending, when rendered, then the textarea and buttons are disabled', () => {
    render(<CommentComposer onSubmit={vi.fn()} onCancel={vi.fn()} isPending={true} />)
    expect(screen.getByPlaceholderText('Leave a comment')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled()
  })

  it('given an error, when rendered, then shows the error text', () => {
    render(
      <CommentComposer onSubmit={vi.fn()} onCancel={vi.fn()} isPending={false} error="failed" />
    )
    expect(screen.getByText('failed')).toBeInTheDocument()
  })

  it('given no autoFocus prop, when rendered, then the textarea does not steal focus', () => {
    render(<CommentComposer onSubmit={vi.fn()} onCancel={vi.fn()} isPending={false} />)
    expect(screen.getByPlaceholderText('Leave a comment')).not.toHaveFocus()
  })

  it('given autoFocus, when rendered, then the textarea is focused', () => {
    render(<CommentComposer onSubmit={vi.fn()} onCancel={vi.fn()} isPending={false} autoFocus />)
    expect(screen.getByPlaceholderText('Leave a comment')).toHaveFocus()
  })

  it('given no mode prop, when rendered, then no mode toggle is shown', () => {
    render(<CommentComposer onSubmit={vi.fn()} onCancel={vi.fn()} isPending={false} />)
    expect(screen.queryByRole('button', { name: 'Single comment' })).not.toBeInTheDocument()
  })

  it('given a mode prop, when rendered, then the mode toggle is shown', () => {
    render(
      <CommentComposer
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isPending={false}
        mode="one-shot"
        onModeChange={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Single comment' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Part of review' })).toBeInTheDocument()
  })

  it('given the review pill is clicked, then onModeChange fires with review', async () => {
    const onModeChange = vi.fn()
    const user = userEvent.setup()
    render(
      <CommentComposer
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isPending={false}
        mode="one-shot"
        onModeChange={onModeChange}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Part of review' }))
    expect(onModeChange).toHaveBeenCalledWith('review')
  })
})
