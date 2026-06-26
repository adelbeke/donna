import { BranchList } from '@/features/branches/components/BranchList/BranchList.tsx'
import { SearchInput } from '@/shared/components/SearchInput/SearchInput.tsx'
import { useBranchStore } from '@/features/branches/stores/branchStore.ts'
import type { ChangeEvent } from 'react'

export function BranchDashboard() {
  const { branchSearch, setBranchSearch } = useBranchStore()
  return (
    <div className={'flex flex-col gap-8'}>
      <SearchInput
        value={branchSearch}
        placeholder={'Filter by branch name…'}
        displayClearButton={branchSearch.length > 0}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setBranchSearch(event.target.value)}
        onClear={() => setBranchSearch('')}
      />
      <BranchList />
    </div>
  )
}
