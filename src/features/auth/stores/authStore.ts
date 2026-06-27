import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GitHubUser } from '@/types/github'

type AuthState = {
  token: string | null
  user: GitHubUser | null
  sessionExpired: boolean
  setToken: (token: string) => void
  setUser: (user: GitHubUser) => void
  logout: () => void
  expireSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      sessionExpired: false,
      setToken: (token) => set({ token, sessionExpired: false }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null, sessionExpired: false }),
      expireSession: () => set({ token: null, user: null, sessionExpired: true }),
    }),
    {
      name: 'pr-dashboard-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
)
