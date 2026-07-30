import { useQuery } from '@tanstack/react-query'
import { createClient, PR_REVIEW_THREADS_QUERY } from '@/providers/github'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { prThreadsKey } from '../lib/queryKeys'
import type { PRDetailMeta, PRKey, PRReviewThread } from '../types'

const MAX_THREAD_PAGES = 4 // 200-thread ceiling

type ThreadsPage = {
  repository: {
    pullRequest:
      | (PRDetailMeta & {
          reviewThreads: {
            pageInfo: { hasNextPage: boolean; endCursor: string }
            nodes: PRReviewThread[]
          }
        })
      | null
  } | null
}

export type PRThreadsResult = { pr: PRDetailMeta; threads: PRReviewThread[]; truncated: boolean }

const fetchAllThreads = async (key: PRKey): Promise<PRThreadsResult> => {
  const client = createClient()
  const threads: PRReviewThread[] = []
  let pr: PRDetailMeta | null = null
  let cursor: string | null = null
  let truncated = false

  for (let page = 1; page <= MAX_THREAD_PAGES; page++) {
    const data: ThreadsPage = await client.request<ThreadsPage>(PR_REVIEW_THREADS_QUERY, {
      owner: key.owner,
      name: key.repo,
      number: key.number,
      cursor,
    })
    const pullRequest = data.repository?.pullRequest
    if (!pullRequest) break
    pr = pullRequest
    threads.push(...pullRequest.reviewThreads.nodes)

    if (!pullRequest.reviewThreads.pageInfo.hasNextPage) break
    if (page === MAX_THREAD_PAGES) {
      truncated = true
      break
    }
    cursor = pullRequest.reviewThreads.pageInfo.endCursor
  }

  if (!pr) throw new Error('Pull request not found')
  return { pr, threads, truncated }
}

export const usePRThreads = (key: PRKey) => {
  const token = useAuthStore((s) => s.token)

  return useQuery<PRThreadsResult>({
    queryKey: prThreadsKey(key),
    enabled: !!token && !!key.owner && !!key.repo && Number.isFinite(key.number),
    staleTime: 30_000,
    // unlike the app-wide default, refetch when the window regains focus — the most likely
    // way a thread changes is the user replying on github.com in the browser
    refetchOnWindowFocus: true,
    queryFn: () => fetchAllThreads(key),
  })
}
