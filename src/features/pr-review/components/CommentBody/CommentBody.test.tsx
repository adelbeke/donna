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

  it('given raw HTML in the body, when rendered, then it stays inert text', () => {
    render(<CommentBody body="<img src=x onerror=alert(1)>" />)
    expect(document.querySelector('img')).not.toBeInTheDocument()
  })
})
