import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PRSection = 'review-requested' | 'authored' | 'mentioned'

export interface PRFilters {
  section: PRSection
  repos: string[]          // empty = all
  hiddenAuthors: string[]  // empty = all
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
  addHiddenAuthor: (pattern: string) => void
  removeHiddenAuthor: (pattern: string) => void
  resetFilters: () => void
}

const defaultFilters: PRFilters = {
  section: 'review-requested',
  repos: [],
  hiddenAuthors: [],
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
      addHiddenAuthor: (pattern) =>
        set((state) => {
          const normalized = pattern.toLowerCase()
          if (state.filters.hiddenAuthors.includes(normalized)) return state
          return { filters: { ...state.filters, hiddenAuthors: [...state.filters.hiddenAuthors, normalized] } }
        }),
      removeHiddenAuthor: (pattern) =>
        set((state) => ({
          filters: {
            ...state.filters,
            hiddenAuthors: state.filters.hiddenAuthors.filter((a) => a !== pattern),
          },
        })),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'pr-dashboard-state',
      merge: (persisted, current) => {
        const p = persisted as Partial<PRStore>
        return {
          ...current,
          ...p,
          filters: { ...current.filters, ...(p.filters ?? {}) },
        }
      },
    }
  )
)
