import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReviewState } from '../types/github'

export type PRSection = 'review-requested' | 'authored' | 'mentioned'

export interface PRFilters {
  section: PRSection
  repos: string[]          // empty = all
  reviewStates: ReviewState[]  // empty = all
  showDrafts: boolean
  showHidden: boolean
  search: string
}

interface PRStore {
  filters: PRFilters
  priorityIds: string[]
  hiddenIds: string[]
  setFilters: (filters: Partial<PRFilters>) => void
  togglePriority: (id: string) => void
  toggleHide: (id: string) => void
  resetFilters: () => void
}

const defaultFilters: PRFilters = {
  section: 'review-requested',
  repos: [],
  reviewStates: [],
  showDrafts: false,
  showHidden: false,
  search: '',
}

export const usePRStore = create<PRStore>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      priorityIds: [],
      hiddenIds: [],
      setFilters: (partial) =>
        set((state) => ({ filters: { ...state.filters, ...partial } })),
      togglePriority: (id) =>
        set((state) => ({
          priorityIds: state.priorityIds.includes(id)
            ? state.priorityIds.filter((p) => p !== id)
            : [...state.priorityIds, id],
        })),
      toggleHide: (id) =>
        set((state) => ({
          hiddenIds: state.hiddenIds.includes(id)
            ? state.hiddenIds.filter((p) => p !== id)
            : [...state.hiddenIds, id],
        })),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'pr-dashboard-state',
    }
  )
)
