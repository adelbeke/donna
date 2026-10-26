import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MergedPRRow } from './MergedPRRow'

const title = 'fix: scope merged section'
const url = 'https://github.com/org/repo/pull/42'

describe('MergedPRRow', () => {
  it('GIVEN a merged PR WHEN rendered THEN shows only its title as a link to GitHub', () => {
    render(<MergedPRRow title={title} url={url} />)

    const actual = screen.getByRole('link', { name: title })

    expect(actual).toHaveAttribute('href', url)
    expect(actual).toHaveAttribute('target', '_blank')
    expect(actual).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
