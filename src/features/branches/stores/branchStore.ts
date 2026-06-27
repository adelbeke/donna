import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type BranchStore = {
  localPaths: string[]
  branchSearch: string
  addLocalPath: (path: string) => void
  removeLocalPath: (path: string) => void
  setBranchSearch: (s: string) => void
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set) => ({
      localPaths: [],
      branchSearch: '',
      addLocalPath: (path) => set((state) => ({ localPaths: [...state.localPaths, path] })),
      removeLocalPath: (path) =>
        set((state) => ({ localPaths: state.localPaths.filter((p) => p !== path) })),
      setBranchSearch: (s) => set({ branchSearch: s }),
    }),
    {
      name: 'branch-dashboard-state',
      merge: (persisted, current) => {
        const p = persisted as Partial<BranchStore>
        return { ...current, localPaths: p.localPaths ?? current.localPaths }
        // ponytail: skip branchSearch — ephemeral
      },
    }
  )
)
