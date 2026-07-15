import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PRSection = 'review-requested' | 'authored' | 'mentioned'

export type GlobalFilters = {
  hiddenAuthors: string[]
  hiddenRepos: string[]
  showHidden: boolean
}

export type ViewFilters = {
  repos: string[]
  showDrafts: boolean
  search: string
}

export type PRStore = {
  view: 'prs' | 'branches'
  section: PRSection
  globalFilters: GlobalFilters
  viewFilters: Record<PRSection, ViewFilters>
  priorityIds: string[]
  hiddenIds: string[]
  notificationHintDismissed: boolean
  contextSwitchThreshold: number
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
  dismissNotificationHint: () => void
  setContextSwitchThreshold: (n: number) => void
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
      notificationHintDismissed: false,
      contextSwitchThreshold: 4,
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
      dismissNotificationHint: () => set({ notificationHintDismissed: true }),
      setContextSwitchThreshold: (n) => set({ contextSwitchThreshold: n }),
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
        // migrate from pre-1.6.0 format: flat `filters` key → globalFilters + viewFilters + section
        if (!p.globalFilters) {
          const old = (
            persisted as {
              filters?: {
                section?: PRSection
                hiddenAuthors?: string[]
                showHidden?: boolean
                repos?: string[]
                showDrafts?: boolean
              }
            }
          ).filters
          const section: PRSection = old?.section ?? current.section
          return {
            ...current,
            ...(p.view && validViews.has(p.view) ? { view: p.view } : {}),
            section,
            globalFilters: {
              ...current.globalFilters,
              hiddenAuthors: old?.hiddenAuthors ?? [],
              showHidden: old?.showHidden ?? false,
            },
            viewFilters: {
              ...current.viewFilters,
              [section]: {
                ...current.viewFilters[section],
                repos: old?.repos ?? [],
                showDrafts: old?.showDrafts ?? false,
              },
            },
            priorityIds: p.priorityIds ?? current.priorityIds,
            hiddenIds: p.hiddenIds ?? current.hiddenIds,
            notificationHintDismissed:
              p.notificationHintDismissed ?? current.notificationHintDismissed,
            contextSwitchThreshold: p.contextSwitchThreshold ?? current.contextSwitchThreshold,
          }
        }
        const validSections = new Set<string>(['review-requested', 'authored', 'mentioned'])
        return {
          ...current,
          ...(p.view && validViews.has(p.view) ? { view: p.view } : {}),
          ...(p.section && validSections.has(p.section) ? { section: p.section } : {}),
          globalFilters: { ...current.globalFilters, ...(p.globalFilters ?? {}) },
          viewFilters: Object.fromEntries(
            (Object.keys(current.viewFilters) as PRSection[]).map((s) => [
              s,
              { ...current.viewFilters[s], ...(p.viewFilters?.[s] ?? {}) },
            ])
          ) as Record<PRSection, ViewFilters>,
          priorityIds: p.priorityIds ?? current.priorityIds,
          hiddenIds: p.hiddenIds ?? current.hiddenIds,
          notificationHintDismissed:
            p.notificationHintDismissed ?? current.notificationHintDismissed,
          contextSwitchThreshold: p.contextSwitchThreshold ?? current.contextSwitchThreshold,
        }
      },
    }
  )
)
