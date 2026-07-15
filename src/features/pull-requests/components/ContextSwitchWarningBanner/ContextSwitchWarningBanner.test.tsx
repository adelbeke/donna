import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ContextSwitchWarningBanner } from './ContextSwitchWarningBanner'

describe('ContextSwitchWarningBanner', () => {
  it('GIVEN count and threshold WHEN rendered THEN shows both values', () => {
    render(<ContextSwitchWarningBanner count={6} threshold={4} />)
    expect(
      screen.getByText(/6 open PRs — heavy context-switching risk \(warning threshold: 4\)/)
    ).toBeInTheDocument()
  })
})
