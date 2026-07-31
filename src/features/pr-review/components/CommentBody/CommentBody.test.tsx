import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommentBody } from './CommentBody'

describe('CommentBody', () => {
  it('given a plain paragraph, when rendered, then shows the text', () => {
    render(<CommentBody body="hello world" />)
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })

  it('given a fenced code block, when rendered, then renders as code', () => {
    render(<CommentBody body={'```js\nconst a = 1\n```'} />)
    expect(screen.getByText('const a = 1')).toBeInTheDocument()
  })

  it('given a link, when rendered, then opens in a new tab', () => {
    render(<CommentBody body="[donna](https://github.com/adelbeke/donna)" />)
    const link = screen.getByRole('link', { name: 'donna' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('given a GFM table, when rendered, then renders table cells', () => {
    render(<CommentBody body={'| a | b |\n|---|---|\n| 1 | 2 |'} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('given an img with an onerror handler, when rendered, then the handler is stripped', () => {
    render(<CommentBody body='<img src="x" onerror="window.xssFired = true">' />)
    expect(document.querySelector('img')).not.toHaveAttribute('onerror')
  })

  it('given a script tag, when rendered, then it is dropped', () => {
    render(<CommentBody body="<script>window.xssFired = true</script>" />)
    expect(document.querySelector('script')).not.toBeInTheDocument()
  })

  it('given raw <details>/<summary> HTML, when rendered, then it renders as a native disclosure', () => {
    render(
      <CommentBody body={'<details><summary>Show details</summary>hidden content</details>'} />
    )
    const summary = screen.getByText('Show details')
    expect(summary.closest('details')).toBeInTheDocument()
    expect(screen.getByText(/hidden content/)).toBeInTheDocument()
  })
})
