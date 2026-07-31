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
})
