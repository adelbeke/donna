import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PRChecksBadge } from './PRChecksBadge'
import { useCheckContexts } from '../../queries/useCheckContexts'

vi.mock('../../queries/useCheckContexts', () => ({
  useCheckContexts: vi.fn(() => ({ checks: [], isLoading: false, refetch: vi.fn() })),
}))

const mockUseCheckContexts = vi.mocked(useCheckContexts)

beforeEach(() => {
  mockUseCheckContexts.mockReturnValue({
    checks: [],
    isLoading: false,
    isRefetching: false,
    refetch: vi.fn(),
  } as never)
})

describe('PRChecksBadge', () => {
  it('GIVEN rollupState is null WHEN rendered THEN renders nothing', () => {
    const { container } = render(
      <PRChecksBadge prId="pr-1" prTitle="Fix the thing" rollupState={null} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('GIVEN a SUCCESS rollup WHEN rendered THEN shows the Checks pass badge', () => {
    render(<PRChecksBadge prId="pr-1" prTitle="Fix the thing" rollupState="SUCCESS" />)
    expect(screen.getByText('Checks pass')).toBeInTheDocument()
  })

  it('GIVEN the badge WHEN clicked THEN opens the checks modal', async () => {
    const user = userEvent.setup()
    render(<PRChecksBadge prId="pr-1" prTitle="Fix the thing" rollupState="SUCCESS" />)
    await user.click(screen.getByText('Checks pass'))
    expect(screen.getByText(`Fix the thing's checks`)).toBeInTheDocument()
  })
})
