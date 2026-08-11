import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PRDetailTabs } from './PRDetailTabs'

describe('PRDetailTabs', () => {
  it('given the review tab is active, when rendered, then it is marked selected', () => {
    render(<PRDetailTabs active="review" onChange={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'Review' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Feed' })).toHaveAttribute('aria-selected', 'false')
  })

  it('given the feed tab is clicked, then onChange fires with "feed"', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<PRDetailTabs active="review" onChange={onChange} />)
    await user.click(screen.getByRole('tab', { name: 'Feed' }))
    expect(onChange).toHaveBeenCalledWith('feed')
  })
})
