import { BranchList } from '@/features/branches/components/BranchList/BranchList.tsx'
import { SearchInput } from '@/shared/components/SearchInput/SearchInput.tsx'
import { usePRStore } from '@/features/pull-requests/stores/prStore.ts'
import type { ChangeEvent } from 'react'

export function BranchDashboard() {
  // TODO: we should have a dedicated store for the search in the branches features
  const { filters, setFilters } = usePRStore()

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilters({
      search: event.target.value,
    })
  }

  const handleClear = () => {
    setFilters({
      search: '',
    })
  }

  return (
    <div className={'flex flex-col gap-8'}>
      <SearchInput
        value={filters.search}
        placeholder={'Filter by branch name…'}
        displayClearButton={filters.search.length > 0}
        onChange={handleChange}
        onClear={handleClear}
      />
      <BranchList />
    </div>
  )
}
