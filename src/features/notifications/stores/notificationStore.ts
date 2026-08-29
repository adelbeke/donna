import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationStore = {
  enabledCategories: NotificationCategory[]
  pollIntervalMs: number
  checksEnabled: Record<ChecksSection, boolean>
  toggleCategory: (category: NotificationCategory) => void
  setPollIntervalMs: (ms: number) => void
  toggleChecksEnabled: (section: ChecksSection) => void
}

const defaultEnabledCategories: NotificationCategory[] = ['review-requested', 'assigned']

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      enabledCategories: defaultEnabledCategories,
      pollIntervalMs: 5 * 60_000,
      checksEnabled: { authored: false, assigned: false },
      toggleCategory: (category) =>
        set((state) => ({
          enabledCategories: state.enabledCategories.includes(category)
            ? state.enabledCategories.filter((c) => c !== category)
            : [...state.enabledCategories, category],
        })),
      setPollIntervalMs: (ms) => set({ pollIntervalMs: ms }),
      toggleChecksEnabled: (section) =>
        set((state) => ({
          checksEnabled: { ...state.checksEnabled, [section]: !state.checksEnabled[section] },
        })),
    }),
    { name: 'notification-preferences' }
  )
)
