import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileTree } from './FileTree'
import { buildFileTree } from '../../lib/fileTree'
import type { PRFile } from '../../types'

const given_file = (filename: string): PRFile => ({
  sha: 'abc',
  filename,
  status: 'modified',
  additions: 3,
  deletions: 1,
  changes: 4,
  blob_url: `https://github.com/o/r/blob/abc/${filename}`,
})

describe('FileTree', () => {
  it('given nested paths, then renders directory rows and file rows', () => {
    const files = [given_file('src/features/pr-review/lib/fileTree.ts'), given_file('README.md')]
    render(<FileTree nodes={buildFileTree(files)} onSelectFile={vi.fn()} />)
    expect(screen.getByText('src/features/pr-review/lib')).toBeInTheDocument()
    expect(screen.getByText('fileTree.ts')).toBeInTheDocument()
    expect(screen.getByText('README.md')).toBeInTheDocument()
  })

  it('given a file row is clicked, then onSelectFile fires with the full filename', async () => {
    const user = userEvent.setup()
    const onSelectFile = vi.fn()
    const files = [given_file('src/foo.ts')]
    render(<FileTree nodes={buildFileTree(files)} onSelectFile={onSelectFile} />)
    await user.click(screen.getByText('foo.ts'))
    expect(onSelectFile).toHaveBeenCalledWith('src/foo.ts')
  })

  it('given a directory row is clicked, then its children are hidden', async () => {
    const user = userEvent.setup()
    const files = [given_file('src/foo.ts')]
    render(<FileTree nodes={buildFileTree(files)} onSelectFile={vi.fn()} />)
    expect(screen.getByText('foo.ts')).toBeInTheDocument()
    await user.click(screen.getByText('src'))
    expect(screen.queryByText('foo.ts')).not.toBeInTheDocument()
  })
})
