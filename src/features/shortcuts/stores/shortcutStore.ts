import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Shortcut } from '../types'

type ShortcutStore = {
  shortcuts: Shortcut[]
  addShortcut: (s: Omit<Shortcut, 'id'>) => void
  removeShortcut: (id: string) => void
  updateShortcut: (id: string, patch: Partial<Omit<Shortcut, 'id'>>) => void
}

export const useShortcutStore = create<ShortcutStore>()(
  persist(
    (set) => ({
      shortcuts: [],
      addShortcut: (s) =>
        set((state) => ({ shortcuts: [...state.shortcuts, { ...s, id: crypto.randomUUID() }] })),
      removeShortcut: (id) =>
        set((state) => ({ shortcuts: state.shortcuts.filter((s) => s.id !== id) })),
      updateShortcut: (id, patch) =>
        set((state) => ({
          shortcuts: state.shortcuts.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
    }),
    { name: 'shortcuts-dashboard-state' }
  )
)
