import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { OnboardingGuide } from './OnboardingGuide'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { usePRStore } from '@/features/pull-requests/stores/prStore'

const LocationProbe = () => <span data-testid="path">{useLocation().pathname}</span>

const renderGuide = (initialPath = '/prs') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <OnboardingGuide />
      <LocationProbe />
    </MemoryRouter>
  )

const given_a_returning_user = () => useOnboardingStore.setState({ hasSeenGuide: true })

beforeEach(() => {
  useOnboardingStore.setState({ hasSeenGuide: false, spotlight: null })
  usePRStore.setState({ section: 'review-requested' })
})

describe('OnboardingGuide — first launch', () => {
  it('given a user who has never seen the guide, then it opens itself', () => {
    renderGuide()
    expect(screen.getByRole('button', { name: 'The three lists' })).toBeInTheDocument()
  })

  it('given a user who already saw the guide, then it stays closed behind its trigger', () => {
    given_a_returning_user()
    renderGuide()
    expect(screen.queryByRole('button', { name: 'The three lists' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'How Donna works' })).toBeInTheDocument()
  })

  it('given the guide is dismissed, then it never auto-opens again', async () => {
    const user = userEvent.setup()
    renderGuide()
    await user.click(screen.getByRole('button', { name: 'Close How Donna works' }))
    expect(useOnboardingStore.getState().hasSeenGuide).toBe(true)
  })

  it('given the trigger is clicked by a returning user, then the guide reopens', async () => {
    given_a_returning_user()
    const user = userEvent.setup()
    renderGuide()
    await user.click(screen.getByRole('button', { name: 'How Donna works' }))
    expect(screen.getByRole('button', { name: 'The three lists' })).toBeInTheDocument()
  })

  it('given the guide opens from the Branches tab, then it routes to the PR view it describes', async () => {
    given_a_returning_user()
    const user = userEvent.setup()
    renderGuide('/branches')
    await user.click(screen.getByRole('button', { name: 'How Donna works' }))
    expect(screen.getByTestId('path')).toHaveTextContent('/prs')
  })
})

describe('OnboardingGuide — live coupling with the app behind it', () => {
  it('given the guide opens, then the section tab matches the first step', () => {
    usePRStore.setState({ section: 'reviewed' })
    renderGuide()
    expect(usePRStore.getState().section).toBe('review-requested')
  })

  it('given the reader advances through the lists chapter, then the real section tabs follow', async () => {
    const user = userEvent.setup()
    renderGuide()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(usePRStore.getState().section).toBe('authored')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(usePRStore.getState().section).toBe('reviewed')
  })

  it('given the star & hide chapter is open, then the PR card actions are spotlit', async () => {
    const user = userEvent.setup()
    renderGuide()
    await user.click(screen.getByRole('button', { name: 'Star & hide' }))
    expect(useOnboardingStore.getState().spotlight).toBe('card-actions')
    expect(usePRStore.getState().section).toBe('review-requested')
  })

  it('given the guide closes, then the spotlight is cleared', async () => {
    const user = userEvent.setup()
    renderGuide()
    await user.click(screen.getByRole('button', { name: 'Star & hide' }))
    await user.click(screen.getByRole('button', { name: 'Close How Donna works' }))
    expect(useOnboardingStore.getState().spotlight).toBeNull()
  })

  it('given the guide closes, then the section the reader started on is restored', async () => {
    given_a_returning_user()
    usePRStore.setState({ section: 'authored' })
    const user = userEvent.setup()
    renderGuide()
    await user.click(screen.getByRole('button', { name: 'How Donna works' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(usePRStore.getState().section).toBe('authored')
    await user.click(screen.getByRole('button', { name: 'Close How Donna works' }))
    expect(usePRStore.getState().section).toBe('authored')
  })
})

describe('OnboardingGuide — navigation', () => {
  it('given a chapter in the spine is clicked, then it jumps to that chapter', async () => {
    const user = userEvent.setup()
    renderGuide()
    await user.click(screen.getByRole('button', { name: 'Local vs GitHub' }))
    expect(screen.getByText(/Stays in Donna/i)).toBeInTheDocument()
  })

  it('given the last step, then the primary action finishes instead of advancing', async () => {
    const user = userEvent.setup()
    renderGuide()
    await user.click(screen.getByRole('button', { name: 'The triage loop' }))
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Start triaging' }))
    expect(screen.queryByRole('button', { name: 'The three lists' })).not.toBeInTheDocument()
    expect(useOnboardingStore.getState().hasSeenGuide).toBe(true)
  })

  it('given the first step, then there is nothing to go back to', () => {
    renderGuide()
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
  })

  it('given the right arrow key, then the guide advances', async () => {
    const user = userEvent.setup()
    renderGuide()
    await user.keyboard('{ArrowRight}')
    expect(usePRStore.getState().section).toBe('authored')
  })

  it('given the left arrow key after advancing, then the guide steps back', async () => {
    const user = userEvent.setup()
    renderGuide()
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowLeft}')
    expect(usePRStore.getState().section).toBe('review-requested')
  })

  it('given the left arrow on the first step, then it stays put rather than wrapping', async () => {
    const user = userEvent.setup()
    renderGuide()
    await user.keyboard('{ArrowLeft}')
    expect(usePRStore.getState().section).toBe('review-requested')
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
  })
})
