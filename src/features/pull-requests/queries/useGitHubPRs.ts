import { useEffect, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient, PR_LIST_QUERY } from '@/providers/github'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { usePRStore } from '@/features/pull-requests/stores/prStore'
import { buildSearchQuery, sortAndPartition } from '../lib/prUtils'
import { applyFilters } from '../lib/prFilters'
import type { PullRequest } from '@/types/github'

export { deriveMyReviewState, sortAndPartition } from '../lib/prUtils'
export { useViewer } from './useViewer'

const MAX_PAGES = 10

type SearchPage = {
  search: {
    issueCount: number
    pageInfo: { hasNextPage: boolean; endCursor: string }
    nodes: PullRequest[]
  }
}

export const usePullRequests = () => {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const section = usePRStore((s) => s.section)
  const globalFilters = usePRStore((s) => s.globalFilters)
  const viewFilters = usePRStore((s) => s.viewFilters)
  const priorityIds = usePRStore((s) => s.priorityIds)
  const hiddenIds = usePRStore((s) => s.hiddenIds)

  const searchQuery = buildSearchQuery(section, user?.login ?? '')

  const query = useInfiniteQuery<SearchPage>({
    queryKey: ['prs', section, user?.login],
    enabled: !!token && !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    initialPageParam: null as string | null,
    getNextPageParam: (last) =>
      last.search.pageInfo.hasNextPage ? last.search.pageInfo.endCursor : undefined,
    queryFn: async ({ pageParam }) => {
      return createClient(token).request<SearchPage>(PR_LIST_QUERY, {
        searchQuery,
        cursor: pageParam,
      })
    },
  })

  // Auto-fetch subsequent pages in background, capped at MAX_PAGES
  useEffect(() => {
    if (query.hasNextPage && !query.isFetchingNextPage && (query.data?.pages.length ?? 0) < MAX_PAGES) {
      void query.fetchNextPage()
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.data?.pages.length, query.fetchNextPage])

  const allNodes = useMemo(() => {
    const seen = new Set<string>()
    return (query.data?.pages.flatMap((p) => p.search.nodes) ?? [])
      .map((pr) => ({
        ...pr,
        isTopPriority: priorityIds.includes(pr.id),
        isHidden: hiddenIds.includes(pr.id),
      }))
      .filter((pr) => {
        if (seen.has(pr.id)) return false
        seen.add(pr.id)
        return true
      })
  }, [query.data, priorityIds, hiddenIds])

  const currentView = viewFilters[section]
  const filtered = useMemo(
    () => applyFilters(allNodes, globalFilters, currentView, section),
    [allNodes, globalFilters, currentView, section]
  )
  const { priorityPRs, regular } = useMemo(
    () => sortAndPartition(filtered, priorityIds),
    [filtered, priorityIds]
  )

  const repos = useMemo(
    () => [...new Set(allNodes.map((pr) => pr.repository.nameWithOwner))].sort(),
    [allNodes]
  )

  const truncated = (query.data?.pages.length ?? 0) >= MAX_PAGES && query.hasNextPage

  return {
    ...query,
    data: regular,
    priorityPRs,
    allPRs: allNodes,
    repos,
    totalCount: query.data?.pages[0]?.search.issueCount ?? 0,
    loadedCount: allNodes.length,
    truncated,
  }
}
