import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingStore } from './onboardingStore'

beforeEach(() => {
  useOnboardingStore.setState({ hasSeenGuide: false, spotlight: null })
})

describe('onboardingStore', () => {
  it('given a user who never opened the guide, then hasSeenGuide is false so it auto-opens once', () => {
    expect(useOnboardingStore.getState().hasSeenGuide).toBe(false)
  })

  it('given markSeen is called, then the guide never auto-opens again', () => {
    useOnboardingStore.getState().markSeen()
    expect(useOnboardingStore.getState().hasSeenGuide).toBe(true)
  })

  it('given markSeen is called twice, then it stays seen', () => {
    useOnboardingStore.getState().markSeen()
    useOnboardingStore.getState().markSeen()
    expect(useOnboardingStore.getState().hasSeenGuide).toBe(true)
  })

  it('given no active step, then there is no spotlight', () => {
    expect(useOnboardingStore.getState().spotlight).toBeNull()
  })

  it('given setSpotlight is called, then the target is exposed to the PR list', () => {
    useOnboardingStore.getState().setSpotlight('card-actions')
    expect(useOnboardingStore.getState().spotlight).toBe('card-actions')
  })

  it('given the persisted slice, then only hasSeenGuide is written to localStorage', () => {
    const partialize = useOnboardingStore.persist.getOptions().partialize
    const actual = partialize?.({ ...useOnboardingStore.getState(), spotlight: 'card-actions' })
    expect(actual).toEqual({ hasSeenGuide: false })
  })
})
