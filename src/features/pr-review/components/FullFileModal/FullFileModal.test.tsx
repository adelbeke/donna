import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FullFileModal } from './FullFileModal'
import type { DiffRow } from '../../types'

const rows: DiffRow[] = [
  { type: 'context', content: 'line1', oldLine: 1, newLine: 1 },
  { type: 'del', content: 'old line2', oldLine: 2, newLine: null },
  { type: 'add', content: 'new line2', oldLine: null, newLine: 2 },
]

describe('FullFileModal', () => {
  it('given rows, when open, then renders them', () => {
    render(
      <FullFileModal
        isOpen
        onClose={vi.fn()}
        filename="src/foo.ts"
        blobUrl="https://github.com/o/r/blob/abc/src/foo.ts"
        rows={rows}
        truncated={false}
        isLoading={false}
      />
    )
    expect(screen.getByText('line1')).toBeInTheDocument()
    expect(screen.getByText('new line2')).toBeInTheDocument()
  })

  it('given isLoading, then shows a loading message instead of rows', () => {
    render(
      <FullFileModal
        isOpen
        onClose={vi.fn()}
        filename="src/foo.ts"
        blobUrl="https://github.com/o/r/blob/abc/src/foo.ts"
        rows={[]}
        truncated={false}
        isLoading={true}
      />
    )
    expect(screen.getByText('Loading file…')).toBeInTheDocument()
  })

  it('given truncated, then shows the truncation notice with a link to GitHub', () => {
    render(
      <FullFileModal
        isOpen
        onClose={vi.fn()}
        filename="src/foo.ts"
        blobUrl="https://github.com/o/r/blob/abc/src/foo.ts"
        rows={rows}
        truncated={true}
        isLoading={false}
      />
    )
    expect(screen.getByText(/truncated view/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open file on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/o/r/blob/abc/src/foo.ts'
    )
  })

  it('given the close button is clicked, then onClose fires', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <FullFileModal
        isOpen
        onClose={onClose}
        filename="src/foo.ts"
        blobUrl="https://github.com/o/r/blob/abc/src/foo.ts"
        rows={rows}
        truncated={false}
        isLoading={false}
      />
    )
    await user.click(screen.getByLabelText('Close src/foo.ts'))
    expect(onClose).toHaveBeenCalled()
  })
})
