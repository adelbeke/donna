import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PRSectionsTabs } from './PRSectionsTabs'
import { usePRStore } from '../../stores/prStore'
import { useOnboardingStore } from '@/features/onboarding/stores/onboardingStore'
import type { PRStore } from '../../stores/prStore'

vi.mock('../../stores/prStore', () => ({ usePRStore: Object.assign(vi.fn(), { getState: vi.fn() }) }))
const mockUsePRStore = vi.mocked(usePRStore)

const mockStore = (section = 'review-requested', setSection = vi.fn()) => {
  const state = { section, setSection }
  mockUsePRStore.mockImplementation((selector: (s: PRStore) => unknown) =>
    selector(state as unknown as PRStore)
  )
  vi.mocked(mockUsePRStore.getState).mockReturnValue(state as unknown as PRStore)
}

const renderWithClient = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <PRSectionsTabs />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  // hasSeenGuide: true keeps the onboarding guide's own modal (rendered via ContributeLinks) closed,
  // so its content doesn't collide with these tests' section-label queries.
  useOnboardingStore.setState({ spotlight: null, hasSeenGuide: true })
  mockStore()
})

describe('PRSectionsTabs — section tabs', () => {
  it('renders all four section tabs in order: My PRs, Review requested, Assigned, Reviewed', () => {
    renderWithClient()
    const buttons = screen.getAllByRole('button')
    const myPRsBtn = screen.getByText('My PRs')
    const reviewRequestedBtn = screen.getByText('Review requested')
    const assignedBtn = screen.getByText('Assigned')
    const reviewedBtn = screen.getByText('Reviewed')
    expect(myPRsBtn).toBeInTheDocument()
    expect(reviewRequestedBtn).toBeInTheDocument()
    expect(assignedBtn).toBeInTheDocument()
    expect(reviewedBtn).toBeInTheDocument()
    // Verify order
    const myPRsIndex = buttons.indexOf(myPRsBtn as HTMLButtonElement)
    const reviewRequestedIndex = buttons.indexOf(reviewRequestedBtn as HTMLButtonElement)
    const assignedIndex = buttons.indexOf(assignedBtn as HTMLButtonElement)
    const reviewedIndex = buttons.indexOf(reviewedBtn as HTMLButtonElement)
    expect(myPRsIndex).toBeLessThan(reviewRequestedIndex)
    expect(reviewRequestedIndex).toBeLessThan(assignedIndex)
    expect(assignedIndex).toBeLessThan(reviewedIndex)
  })

  it('active section tab has accent styling', () => {
    mockStore('authored')
    renderWithClient()
    const activeBtn = screen.getByText('My PRs')
    expect(activeBtn.className).toContain('text-[var(--color-accent)]')
  })

  it('clicking a tab calls setSection', () => {
    const setSection = vi.fn()
    mockStore('review-requested', setSection)
    renderWithClient()
    fireEvent.click(screen.getByText('My PRs'))
    expect(setSection).toHaveBeenCalledWith('authored')
  })
})

describe('PRSectionsTabs — onboarding spotlight', () => {
  it('given no spotlight, then no tab is ringed', () => {
    renderWithClient()
    expect(screen.getByText('Review requested').className).not.toContain('animate-spotlight-ring')
  })

  it('given the guide is walking the lists, then the active tab is ringed', () => {
    useOnboardingStore.setState({ spotlight: 'sections' })
    mockStore('authored')
    renderWithClient()
    expect(screen.getByText('My PRs').className).toContain('animate-spotlight-ring')
    expect(screen.getByText('Reviewed').className).not.toContain('animate-spotlight-ring')
  })

  it('given the guide is spotlighting card actions, then no tab is ringed', () => {
    useOnboardingStore.setState({ spotlight: 'card-actions' })
    renderWithClient()
    expect(screen.getByText('Review requested').className).not.toContain('animate-spotlight-ring')
  })
})
