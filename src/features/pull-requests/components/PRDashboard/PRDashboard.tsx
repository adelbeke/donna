import { SearchInput } from '@/shared/components/SearchInput/SearchInput.tsx'
import { usePRStore } from '@/features/pull-requests/stores/prStore.ts'
import type { ChangeEvent } from 'react'
import { Filters } from '@/features/pull-requests/components/Filters/Filters.tsx'
import { PRList } from '@/features/pull-requests/components/PRList/PRList.tsx'
import { SettingsModal } from '@/features/pull-requests/components/SettingsModal/SettingsModal.tsx'

export function PRDashboard() {
  const section = usePRStore((s) => s.section)
  const viewFilters = usePRStore((s) => s.viewFilters)
  const setViewFilters = usePRStore((s) => s.setViewFilters)

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
        <Filters />
        <PRList />
      </div>
    </div>
  )
}
