import { useEffect } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { createGitHubClient, PULL_REQUESTS_QUERY, VIEWER_QUERY } from '../lib/github'
import { useAuthStore } from '../store/authStore'
import { usePRStore } from '../store/prStore'
import type { PullRequest, GitHubUser, ReviewState } from '../types/github'

const MAX_PAGES = 10

interface SearchResult {
  search: {
    issueCount: number
    pageInfo: { hasNextPage: boolean; endCursor: string }
    nodes: PullRequest[]
  }
}

interface ViewerResult {
  viewer: GitHubUser
}

function buildSearchQuery(section: string, login: string): string {
  const base = 'is:open is:pr archived:false'
  switch (section) {
    case 'review-requested':
      return `${base} review-requested:${login}`
    case 'authored':
      return `${base} author:${login}`
    case 'mentioned':
      return `${base} mentions:${login}`
    default:
      return `${base} review-requested:${login}`
  }
}

function deriveMyReviewState(pr: PullRequest, login: string): ReviewState | null {
  const myReviews = pr.reviews.nodes.filter((r) => r.author.login === login)
  if (!myReviews.length) return null
  const sorted = [...myReviews].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  )
  return sorted[0].state
}

export function sortAndPartition(
  prs: PullRequest[],
  priorityIds: string[],
  sortOrder: 'newest' | 'oldest',
): { regular: PullRequest[]; priorityPRs: PullRequest[] } {
  const byDate = [...prs].sort((a, b) => {
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return sortOrder === 'oldest' ? -diff : diff
  })
  return {
    priorityPRs: byDate.filter((pr) => priorityIds.includes(pr.id)),
    regular: byDate.filter((pr) => !priorityIds.includes(pr.id)),
  }
}

export function useViewer() {
  const token = useAuthStore((s) => s.token)

  return useQuery<GitHubUser>({
    queryKey: ['viewer'],
    enabled: !!token,
    queryFn: async () => {
      const client = createGitHubClient(token!)
      const data = await client.request<ViewerResult>(VIEWER_QUERY)
      return data.viewer
    },
  })
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
      const client = createGitHubClient(token!)
      return client.request<SearchResult>(PULL_REQUESTS_QUERY, {
        searchQuery,
        cursor: pageParam ?? undefined,
      })
    },
    getNextPageParam: (lastPage, pages) => {
      if (pages.length >= MAX_PAGES) return undefined
      return lastPage.search.pageInfo.hasNextPage
        ? lastPage.search.pageInfo.endCursor
        : undefined
    },
  })

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query

  // Auto-fetch all pages
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const allNodes = (query.data?.pages ?? [])
    .flatMap((p) => p.search.nodes)
    .map((pr) => ({
      ...pr,
      myReviewState: deriveMyReviewState(pr, user!.login),
      isTopPriority: priorityIds.includes(pr.id),
      isHidden: hiddenIds.includes(pr.id),
    }))

  // Apply client-side filters
  const filtered = allNodes
    .map((pr) => ({
      ...pr,
      isHidden: hiddenIds.includes(pr.id),
    }))
    .filter((pr) => {
      if (!filters.showHidden && pr.isHidden) return false
      if (!filters.showDrafts && pr.isDraft) return false
      if (filters.repos.length && !filters.repos.includes(pr.repository.nameWithOwner))
        return false
      if (
        filters.reviewStates.length &&
        !filters.reviewStates.includes(pr.myReviewState as ReviewState)
      )
        return false
      if (filters.search && !pr.title.toLowerCase().includes(filters.search.toLowerCase()))
        return false
      return true
    })

  const { priorityPRs, regular } = sortAndPartition(filtered, priorityIds, filters.sortOrder)

  const repos = [...new Set(allNodes.map((pr) => pr.repository.nameWithOwner))].sort()

  const totalCount = query.data?.pages[0]?.search.issueCount ?? 0
  const loadedCount = allNodes.length
  const truncated = !!query.hasNextPage

  return { ...query, data: regular, priorityPRs, repos, totalCount, loadedCount, truncated }
}
