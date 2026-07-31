import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiffRowView } from './DiffRowView'
import type { DiffRow } from '../../types'

describe('DiffRowView', () => {
  it('given a hunk row, when rendered, then shows the raw header text', () => {
    render(
      <DiffRowView
        row={{ type: 'hunk', content: '@@ -1,2 +1,2 @@', oldLine: null, newLine: null }}
      />
    )
    expect(screen.getByText('@@ -1,2 +1,2 @@')).toBeInTheDocument()
  })

  it('given an addition row, when rendered, then shows the content and newLine', () => {
    const row: DiffRow = { type: 'add', content: 'const a = 1', oldLine: null, newLine: 3 }
    render(<DiffRowView row={row} />)
    expect(screen.getByText('const a = 1')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('given onAddComment is not provided, then no add-comment button is rendered', () => {
    const row: DiffRow = { type: 'context', content: 'x', oldLine: 1, newLine: 1 }
    render(<DiffRowView row={row} />)
    expect(screen.queryByLabelText('Add comment')).not.toBeInTheDocument()
  })

  it('given onAddComment is provided, when the button is clicked, then it fires', async () => {
    const onAddComment = vi.fn()
    const user = userEvent.setup()
    const row: DiffRow = { type: 'context', content: 'x', oldLine: 1, newLine: 1 }
    render(<DiffRowView row={row} onAddComment={onAddComment} />)
    await user.click(screen.getByLabelText('Add comment'))
    expect(onAddComment).toHaveBeenCalled()
  })

  it('given a noNewline row, when rendered, then shows the marker', () => {
    const row: DiffRow = { type: 'add', content: 'x', oldLine: null, newLine: 1, noNewline: true }
    render(<DiffRowView row={row} />)
    expect(screen.getByText('(no newline at end of file)')).toBeInTheDocument()
  })

  it('given a language, when rendered, then still shows the full code text', () => {
    const row: DiffRow = { type: 'add', content: 'const a = 1', oldLine: null, newLine: 3 }
    render(<DiffRowView row={row} language="typescript" />)
    expect(screen.getByText((_, el) => el?.textContent === 'const a = 1')).toBeInTheDocument()
  })

  it('given an expand row with a known count, when rendered, then shows the line count', () => {
    const row: DiffRow = {
      type: 'expand',
      content: '',
      oldLine: null,
      newLine: null,
      expandCount: 5,
    }
    render(<DiffRowView row={row} />)
    expect(screen.getByText('Expand 5 lines')).toBeInTheDocument()
  })

  it('given an expand row with no known count, when rendered, then shows the open-ended label', () => {
    const row: DiffRow = {
      type: 'expand',
      content: '',
      oldLine: null,
      newLine: null,
      expandCount: null,
    }
    render(<DiffRowView row={row} />)
    expect(screen.getByText('Expand down')).toBeInTheDocument()
  })

  it('given an expand row is clicked, then onExpand fires', async () => {
    const onExpand = vi.fn()
    const user = userEvent.setup()
    const row: DiffRow = {
      type: 'expand',
      content: '',
      oldLine: null,
      newLine: null,
      expandCount: 3,
    }
    render(<DiffRowView row={row} onExpand={onExpand} />)
    await user.click(screen.getByRole('button'))
    expect(onExpand).toHaveBeenCalled()
  })

  it('given an expand row is loading, then it shows a loading label and is disabled', () => {
    const row: DiffRow = {
      type: 'expand',
      content: '',
      oldLine: null,
      newLine: null,
      expandCount: 3,
    }
    render(<DiffRowView row={row} isExpanding />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
