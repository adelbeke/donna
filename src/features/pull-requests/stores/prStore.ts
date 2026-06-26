import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PRSection = 'review-requested' | 'authored' | 'mentioned'

export interface GlobalFilters {
  hiddenAuthors: string[]
  hiddenRepos: string[]
  showHidden: boolean
}

export interface ViewFilters {
  repos: string[]
  showDrafts: boolean
  search: string
}

interface PRStore {
  view: 'prs' | 'branches'
  section: PRSection
  globalFilters: GlobalFilters
  viewFilters: Record<PRSection, ViewFilters>
  priorityIds: string[]
  hiddenIds: string[]
  setView: (v: 'prs' | 'branches') => void
  setSection: (s: PRSection) => void
  setGlobalFilters: (partial: Partial<GlobalFilters>) => void
  setViewFilters: (s: PRSection, partial: Partial<ViewFilters>) => void
  addHiddenAuthor: (pattern: string) => void
  removeHiddenAuthor: (pattern: string) => void
  addHiddenRepo: (repo: string) => void
  removeHiddenRepo: (repo: string) => void
  togglePriority: (id: string) => void
  toggleHide: (id: string) => void
  resetFilters: () => void
}

const defaultViewFilters: ViewFilters = {
  repos: [],
  showDrafts: false,
  search: '',
}

const defaultGlobalFilters: GlobalFilters = {
  hiddenAuthors: [],
  hiddenRepos: [],
  showHidden: false,
}

const defaultViewFiltersAll: Record<PRSection, ViewFilters> = {
  'review-requested': { ...defaultViewFilters },
  authored: { ...defaultViewFilters },
  mentioned: { ...defaultViewFilters },
}

export const usePRStore = create<PRStore>()(
  persist(
    (set) => ({
      view: 'prs' as const,
      section: 'review-requested' as PRSection,
      globalFilters: defaultGlobalFilters,
      viewFilters: defaultViewFiltersAll,
      priorityIds: [],
      hiddenIds: [],
      setView: (v) => set({ view: v }),
      setSection: (s) => set({ section: s }),
      setGlobalFilters: (partial) =>
        set((state) => ({ globalFilters: { ...state.globalFilters, ...partial } })),
      setViewFilters: (s, partial) =>
        set((state) => ({
          viewFilters: { ...state.viewFilters, [s]: { ...state.viewFilters[s], ...partial } },
        })),
      addHiddenAuthor: (pattern) =>
        set((state) => {
          const normalized = pattern.toLowerCase()
          if (state.globalFilters.hiddenAuthors.includes(normalized)) return state
          return {
            globalFilters: {
              ...state.globalFilters,
              hiddenAuthors: [...state.globalFilters.hiddenAuthors, normalized],
            },
          }
        }),
      removeHiddenAuthor: (pattern) =>
        set((state) => ({
          globalFilters: {
            ...state.globalFilters,
            hiddenAuthors: state.globalFilters.hiddenAuthors.filter((a) => a !== pattern),
          },
        })),
      addHiddenRepo: (repo) =>
        set((state) => {
          const normalized = repo.toLowerCase()
          if (state.globalFilters.hiddenRepos.includes(normalized)) return state
          return {
            globalFilters: {
              ...state.globalFilters,
              hiddenRepos: [...state.globalFilters.hiddenRepos, normalized],
            },
          }
        }),
      removeHiddenRepo: (repo) =>
        set((state) => ({
          globalFilters: {
            ...state.globalFilters,
            hiddenRepos: state.globalFilters.hiddenRepos.filter((r) => r !== repo),
          },
        })),
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
      resetFilters: () =>
        set((state) => ({
          viewFilters: {
            ...state.viewFilters,
            [state.section]: { ...defaultViewFilters },
          },
        })),
    }),
    {
      name: 'pr-dashboard-state',
      merge: (persisted, current) => {
        const p = persisted as Partial<PRStore>
        const validViews = new Set<string>(['prs', 'branches'])
        // ponytail: drop old 'filters' key — muted authors lost once on first upgrade
        if (!p.globalFilters) {
          return {
            ...current,
            ...(p.view && validViews.has(p.view) ? { view: p.view } : {}),
          }
        }
        return {
          ...current,
          ...(p.view && validViews.has(p.view) ? { view: p.view } : {}),
          ...(p.section ? { section: p.section } : {}),
          globalFilters: { ...current.globalFilters, ...(p.globalFilters ?? {}) },
          viewFilters: { ...current.viewFilters, ...(p.viewFilters ?? {}) },
        }
      },
    }
  )
)
