import {SearchInput} from "@/shared/components/SearchInput/SearchInput.tsx";
import {usePRStore} from "@/features/pull-requests/stores/prStore.ts";
import type {ChangeEvent} from "react";
import {Filters} from "@/features/pull-requests/components/Filters/Filters.tsx";
import {PRList} from "@/features/pull-requests/components/PRList/PRList.tsx";

export function PRDashboard() {
    const { filters, setFilters} = usePRStore()

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
        <div className="flex-col flex gap-8">
            <SearchInput value={filters.search} placeholder={'Filter by title…'} displayClearButton={filters.search.length > 0} onChange={handleChange} onClear={handleClear} />
            <div className="flex gap-8">
                <Filters />
                <PRList />
            </div>
        </div>
    )
}