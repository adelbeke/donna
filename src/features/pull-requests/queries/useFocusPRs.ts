import { useEffect, useMemo } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient, PR_DETAILS_BATCH_QUERY } from '@/providers/github'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { usePRStore } from '@/features/pull-requests/stores/prStore'
import { usePullRequests } from './useGitHubPRs'
import type { PRDetails } from './usePRDetails'
import { groupIntoBuckets } from '../lib/focus'

// A PR that hasn't moved in weeks is not today's work. Classifying the most recent slice keeps the
// view responsive instead of pulling details for every PR the three searches can return (~600).
const MAX_FOCUS_CANDIDATES = 60
const DETAILS_BATCH_SIZE = 25

type BatchResult = { nodes: (PRDetails | null)[] }

const chunk = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

export const useFocusPRs = () => {
  const token = useAuthStore((s) => s.token)
  const login = useAuthStore((s) => s.user?.login ?? '')
  const priorityIds = usePRStore((s) => s.priorityIds)
  const queryClient = useQueryClient()

  const {
    data: regularPRs = [],
    priorityPRs = [],
    reviewRequestedIds,
    isLoading: isLoadingSearches,
    isFetching,
    isFetchingNextPage,
    error,
    refetch,
  } = usePullRequests()

  // The filtered set, not `allPRs` — Focus inherits the repo/search/draft/mute filters that the
  // shared SettingsModal and toggles drive, exactly like every other section.
  const filteredPRs = useMemo(
    () => [...priorityPRs, ...regularPRs],
    [priorityPRs, regularPRs]
  )

  const candidateIds = useMemo(
    () =>
      [...filteredPRs]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, MAX_FOCUS_CANDIDATES)
        .map((pr) => pr.id)
        .sort(),
    [filteredPRs]
  )

  const detailsQuery = useQuery<PRDetails[]>({
    queryKey: ['pr-details-batch', candidateIds],
    enabled: !!token && candidateIds.length > 0,
    staleTime: 60_000,
    // Ids shift as background pages land; keep the previous classification on screen rather than
    // collapsing the whole view back to skeletons on every page.
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const client = createClient()
      const pages = await Promise.all(
        chunk(candidateIds, DETAILS_BATCH_SIZE).map((ids) =>
          client.request<BatchResult>(PR_DETAILS_BATCH_QUERY, { ids })
        )
      )
      return pages.flatMap((page) => page.nodes).filter((node): node is PRDetails => !!node?.id)
    },
  })

  // Seed the per-card cache so every PRCard's usePRDetails resolves from the batch instead of
  // firing its own `gh api graphql` subprocess — and so the plain section views open warm too.
  const details = detailsQuery.data
  useEffect(() => {
    for (const node of details ?? []) {
      queryClient.setQueryData(['pr-details', node.id], node)
    }
  }, [details, queryClient])

  const buckets = useMemo(() => {
    const byId = new Map((details ?? []).map((node) => [node.id, node]))
    const enriched = filteredPRs
      .filter((pr) => byId.has(pr.id))
      .map((pr) => ({ ...pr, ...byId.get(pr.id) }))
    return groupIntoBuckets(enriched, login, reviewRequestedIds, priorityIds)
  }, [filteredPRs, details, login, reviewRequestedIds, priorityIds])

  const total = Object.values(buckets).reduce((sum, prs) => sum + prs.length, 0)

  return {
    buckets,
    total,
    isLoading: isLoadingSearches || (detailsQuery.isLoading && candidateIds.length > 0),
    isFetching: isFetching || detailsQuery.isFetching,
    isFetchingNextPage,
    error: error ?? detailsQuery.error,
    refetch,
  }
}
