import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { NewPRsBadge } from './NewPRsBadge'

describe('NewPRsBadge', () => {
  it('renders singular label for count=1', () => {
    render(<NewPRsBadge count={1} onDismiss={vi.fn()} />)
    expect(screen.getByText(/1 new pull request$/)).toBeInTheDocument()
  })

  it('renders plural label for count>1', () => {
    render(<NewPRsBadge count={3} onDismiss={vi.fn()} />)
    expect(screen.getByText(/3 new pull requests/)).toBeInTheDocument()
  })

  it('calls onDismiss when clicked', async () => {
    const dismiss = vi.fn()
    render(<NewPRsBadge count={2} onDismiss={dismiss} />)
    await userEvent.click(screen.getByRole('button'))
    expect(dismiss).toHaveBeenCalledOnce()
  })
})
