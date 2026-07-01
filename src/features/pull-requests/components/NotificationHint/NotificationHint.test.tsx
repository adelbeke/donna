import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { NotificationHint } from './NotificationHint'

describe('NotificationHint', () => {
  it('calls onDismiss when the dismiss button is clicked', async () => {
    const dismiss = vi.fn()
    render(<NotificationHint onDismiss={dismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(dismiss).toHaveBeenCalledOnce()
  })
})
