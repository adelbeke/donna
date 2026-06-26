import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Filters } from './Filters'
import { usePRStore } from '../../stores/prStore'

vi.mock('../../stores/prStore', () => ({ usePRStore: vi.fn() }))
const mockUsePRStore = vi.mocked(usePRStore)

function mockStore(section = 'review-requested', setSection = vi.fn()) {
  mockUsePRStore.mockImplementation((selector?: (s: unknown) => unknown) => {
    const state = { section, setSection }
    return selector ? selector(state) : state
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockStore()
})

describe('Filters — section tabs', () => {
  it('renders all three section tabs', () => {
    render(<Filters />)
    expect(screen.getByText('Review requested')).toBeInTheDocument()
    expect(screen.getByText('My PRs')).toBeInTheDocument()
    expect(screen.getByText('Mentioned')).toBeInTheDocument()
  })

  it('active section tab has accent styling', () => {
    mockStore('authored')
    render(<Filters />)
    const activeBtn = screen.getByText('My PRs')
    expect(activeBtn.className).toContain('text-[var(--color-accent)]')
  })

  it('clicking a tab calls setSection', () => {
    const setSection = vi.fn()
    mockStore('review-requested', setSection)
    render(<Filters />)
    fireEvent.click(screen.getByText('My PRs'))
    expect(setSection).toHaveBeenCalledWith('authored')
  })
})
