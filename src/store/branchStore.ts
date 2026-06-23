import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BranchStore {
  localPaths: string[]
  addLocalPath: (path: string) => void
  removeLocalPath: (path: string) => void
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set) => ({
      localPaths: [],
      addLocalPath: (path) => set((state) => ({ localPaths: [...state.localPaths, path] })),
      removeLocalPath: (path) => set((state) => ({ localPaths: state.localPaths.filter((p) => p !== path) })),
    }),
    { name: 'branch-dashboard-state' }
  )
)
