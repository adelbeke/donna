import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient, PULL_REQUESTS_QUERY } from '@/providers/github'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { usePRStore } from '@/features/pull-requests/stores/prStore'
import { buildSearchQuery, deriveMyReviewState, sortAndPartition } from '../lib/prUtils'
import { applyFilters } from '../lib/prFilters'
import type { PullRequest } from '@/types/github'

export { deriveMyReviewState, sortAndPartition } from '../lib/prUtils'
export { useViewer } from './useViewer'

const MAX_PAGES = 10

interface SearchResult {
  search: {
    issueCount: number
    pageInfo: { hasNextPage: boolean; endCursor: string }
    nodes: PullRequest[]
  }
}

export function usePullRequests() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const filters = usePRStore((s) => s.filters)
  const priorityIds = usePRStore((s) => s.priorityIds)
  const hiddenIds = usePRStore((s) => s.hiddenIds)

  const searchQuery = buildSearchQuery(filters.section, user?.login ?? '')

  const query = useInfiniteQuery<SearchResult>({
    queryKey: ['prs', filters.section, user?.login],
    enabled: !!token && !!user,
    staleTime: 60_000,
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const client = createClient(token)
      return client.request<SearchResult>(PULL_REQUESTS_QUERY, {
        searchQuery,
        cursor: pageParam ?? undefined,
      })
    },
    getNextPageParam: (lastPage, pages) => {
      if (pages.length >= MAX_PAGES) return undefined
      return lastPage.search.pageInfo.hasNextPage ? lastPage.search.pageInfo.endCursor : undefined
    },
  })

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query

  const allNodes = useMemo(
    () =>
      (query.data?.pages ?? [])
        .flatMap((p) => p.search.nodes)
        .map((pr) => ({
          ...pr,
          myReviewState: deriveMyReviewState(pr, user!.login),
          isTopPriority: priorityIds.includes(pr.id),
          isHidden: hiddenIds.includes(pr.id),
        })),
    [query.data, user, priorityIds, hiddenIds]
  )

  const filtered = useMemo(() => applyFilters(allNodes, filters), [allNodes, filters])
  const { priorityPRs, regular } = useMemo(
    () => sortAndPartition(filtered, priorityIds),
    [filtered, priorityIds]
  )

  const repos = useMemo(
    () => [...new Set(allNodes.map((pr) => pr.repository.nameWithOwner))].sort(),
    [allNodes]
  )

  const totalCount = query.data?.pages[0]?.search.issueCount ?? 0
  const loadedCount = allNodes.length
  const lastPage = query.data?.pages[query.data.pages.length - 1]
  const hitPageCap = (query.data?.pages.length ?? 0) >= MAX_PAGES
  const truncated = hitPageCap && !!lastPage?.search.pageInfo.hasNextPage

  return {
    ...query,
    data: regular,
    priorityPRs,
    allPRs: allNodes,
    repos,
    totalCount,
    loadedCount,
    truncated,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  }
}
