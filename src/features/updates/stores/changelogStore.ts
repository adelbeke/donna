import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ChangelogStore = {
  lastSeenVersion: string | null
  markSeen: (version: string) => void
}

export const useChangelogStore = create<ChangelogStore>()(
  persist(
    (set) => ({
      lastSeenVersion: null,
      markSeen: (version) => set({ lastSeenVersion: version }),
    }),
    { name: 'donna-changelog-state' }
  )
)
