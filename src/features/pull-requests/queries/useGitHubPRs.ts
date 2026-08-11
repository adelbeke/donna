import { useEffect, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient, PR_LIST_QUERY } from '@/providers/github'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { usePRStore, type SearchSection } from '@/features/pull-requests/stores/prStore'
import { buildSearchQuery, sortAndPartition } from '../lib/prUtils'
import { applyFilters, isRepoMatchedBy } from '../lib/prFilters'
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

// One GitHub search, paged and enriched. `enabled` lets a caller mount every section's search in a
// fixed hook order (React requires that) while only paying for the ones it actually needs — the
// Focus view enables all three, every other section enables exactly one.
export const usePRSearch = (section: SearchSection, enabled: boolean) => {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const priorityIds = usePRStore((s) => s.priorityIds)
  const hiddenIds = usePRStore((s) => s.hiddenIds)

  const searchQuery = buildSearchQuery(section, user?.login ?? '')

  const query = useInfiniteQuery<SearchPage>({
    queryKey: ['prs', section, user?.login],
    enabled: enabled && !!token && !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    initialPageParam: null as string | null,
    getNextPageParam: (last) =>
      last.search.pageInfo.hasNextPage ? last.search.pageInfo.endCursor : undefined,
    queryFn: async ({ pageParam }) => {
      return createClient().request<SearchPage>(PR_LIST_QUERY, {
        searchQuery,
        cursor: pageParam,
      })
    },
  })

  // Auto-fetch subsequent pages in background, capped at MAX_PAGES
  useEffect(() => {
    if (
      enabled &&
      query.hasNextPage &&
      !query.isFetchingNextPage &&
      (query.data?.pages.length ?? 0) < MAX_PAGES
    ) {
      void query.fetchNextPage()
    }
  }, [
    enabled,
    query.hasNextPage,
    query.isFetchingNextPage,
    query.data?.pages.length,
    query.fetchNextPage,
  ])

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

  return { query, allNodes }
}

export const usePullRequests = () => {
  const section = usePRStore((s) => s.section)
  const globalFilters = usePRStore((s) => s.globalFilters)
  const viewFilters = usePRStore((s) => s.viewFilters)
  const priorityIds = usePRStore((s) => s.priorityIds)
  const knownRepos = usePRStore((s) => s.knownRepos)
  const setViewFilters = usePRStore((s) => s.setViewFilters)
  const setKnownRepos = usePRStore((s) => s.setKnownRepos)

  const isFocus = section === 'focus'
  const reviewRequested = usePRSearch('review-requested', isFocus || section === 'review-requested')
  const authored = usePRSearch('authored', isFocus || section === 'authored')
  const reviewed = usePRSearch('reviewed', isFocus || section === 'reviewed')

  const bySection = { 'review-requested': reviewRequested, authored, reviewed }
  const sources = isFocus ? [reviewRequested, authored, reviewed] : [bySection[section]]
  const query = sources[0].query

  const allNodes = useMemo(() => {
    if (!isFocus) return sources[0].allNodes
    const seen = new Set<string>()
    return sources
      .flatMap((source) => source.allNodes)
      .filter((pr) => {
        if (seen.has(pr.id)) return false
        seen.add(pr.id)
        return true
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocus, reviewRequested.allNodes, authored.allNodes, reviewed.allNodes])

  const reviewRequestedIds = useMemo(
    () => new Set(reviewRequested.allNodes.map((pr) => pr.id)),
    [reviewRequested.allNodes]
  )

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

  const visibleRepos = useMemo(
    () => repos.filter((r) => !globalFilters.hiddenRepos.some((h) => isRepoMatchedBy(r, h))),
    [repos, globalFilters.hiddenRepos]
  )

  // Auto-select repos newly discovered under an org whose previously-known repos were all selected.
  useEffect(() => {
    const previouslyKnown = knownRepos[section] ?? []
    const newRepos = visibleRepos.filter((r) => !previouslyKnown.includes(r))
    if (newRepos.length === 0) return

    const toAutoSelect = newRepos.filter((r) => {
      const org = r.split('/')[0]
      const orgReposKnownBefore = previouslyKnown.filter((k) => k.split('/')[0] === org)
      return (
        orgReposKnownBefore.length > 0 &&
        orgReposKnownBefore.every((k) => currentView.repos.includes(k))
      )
    })
    if (toAutoSelect.length > 0) {
      setViewFilters(section, { repos: [...currentView.repos, ...toAutoSelect] })
    }
    setKnownRepos(section, visibleRepos)
  }, [visibleRepos, section, knownRepos, currentView.repos, setViewFilters, setKnownRepos])

  const truncated = sources.some(
    (source) => (source.query.data?.pages.length ?? 0) >= MAX_PAGES && source.query.hasNextPage
  )

  return {
    ...query,
    // Focus fans out over three searches, so its loading/error surface is the union of all of them.
    isLoading: sources.some((source) => source.query.isLoading),
    isFetching: sources.some((source) => source.query.isFetching),
    isFetchingNextPage: sources.some((source) => source.query.isFetchingNextPage),
    error: sources.find((source) => source.query.error)?.query.error ?? null,
    refetch: () => Promise.all(sources.map((source) => source.query.refetch())),
    data: regular,
    priorityPRs,
    allPRs: allNodes,
    reviewRequestedIds,
    repos,
    totalCount: sources.reduce(
      (total, source) => total + (source.query.data?.pages[0]?.search.issueCount ?? 0),
      0
    ),
    loadedCount: allNodes.length,
    truncated,
  }
}
