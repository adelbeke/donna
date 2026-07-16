import { useState, type ChangeEvent } from 'react'
import { Terminal } from 'lucide-react'
import { SearchInput } from '@/shared/components/SearchInput/SearchInput.tsx'
import { usePRStore } from '@/features/pull-requests/stores/prStore.ts'
import { PRSectionsTabs } from '@/features/pull-requests/components/PRSectionsTabs/PRSectionsTabs.tsx'
import { PRList } from '@/features/pull-requests/components/PRList/PRList.tsx'
import { SettingsModal } from '@/features/pull-requests/components/SettingsModal/SettingsModal.tsx'
import { ShortcutsManagerModal, useShortcutStore } from '@/features/shortcuts/exports'

export const PRDashboard = () => {
  const section = usePRStore((s) => s.section)
  const viewFilters = usePRStore((s) => s.viewFilters)
  const setViewFilters = usePRStore((s) => s.setViewFilters)
  const shortcuts = useShortcutStore((s) => s.shortcuts)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const search = viewFilters[section].search

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setViewFilters(section, { search: event.target.value })
  }

  const handleClear = () => {
    setViewFilters(section, { search: '' })
  }

  return (
    <div className="flex-col flex gap-8">
      <div className="flex items-center gap-2">
        <SearchInput
          value={search}
          placeholder={'Filter by title…'}
          displayClearButton={search.length > 0}
          onChange={handleChange}
          onClear={handleClear}
        />
        <SettingsModal />
      </div>
      <div className="flex gap-8">
        <PRSectionsTabs />
        <PRList />
      </div>
      {section === 'authored' && (
        <button
          onClick={() => setShortcutsOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-[var(--color-accent)] text-white shadow-lg px-4 py-3 cursor-pointer hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
        >
          <Terminal size={16} />
          Shortcuts
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
            {shortcuts.length}
          </span>
        </button>
      )}
      <ShortcutsManagerModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}
