import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BranchStore {
  selectedRepos: string[]
  setSelectedRepos: (repos: string[]) => void
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set) => ({
      selectedRepos: [],
      setSelectedRepos: (repos) => set({ selectedRepos: repos }),
    }),
    { name: 'branch-dashboard-state' }
  )
)
