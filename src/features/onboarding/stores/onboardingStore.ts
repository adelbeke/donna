import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SpotlightTarget } from '../lib/steps'

type OnboardingStore = {
  hasSeenGuide: boolean
  spotlight: SpotlightTarget | null
  markSeen: () => void
  setSpotlight: (target: SpotlightTarget | null) => void
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasSeenGuide: false,
      spotlight: null,
      markSeen: () => set({ hasSeenGuide: true }),
      setSpotlight: (target) => set({ spotlight: target }),
    }),
    {
      name: 'donna-onboarding',
      // ponytail: `spotlight` is per-session UI state — persisting it would leave a stale ring
      // on a PR card after a restart. Only the once-ever "seen" flag is durable.
      partialize: (state) => ({ hasSeenGuide: state.hasSeenGuide }),
    }
  )
)
