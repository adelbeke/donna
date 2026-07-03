import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient, PR_LIST_QUERY } from '@/providers/github'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { buildSearchQuery } from '../lib/prUtils'
import { computeNewIds, loadSeenIds, saveSeenIds } from '../lib/prNotifications'
import type { PullRequest } from '@/types/github'

const POLL_INTERVAL_MS = 5 * 60 * 1000

type SearchPage = {
  search: { nodes: PullRequest[] }
}

// Polls "review requested" independently of whichever section/view is on
// screen, so a review request surfaces even while looking at "My PRs" or
// the Branches tab. Mount once at the app shell level.
export const usePRNotifications = () => {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const permissionRequested = useRef(false)

  useEffect(() => {
    if (permissionRequested.current || typeof Notification === 'undefined') return
    permissionRequested.current = true
    if (Notification.permission === 'default') void Notification.requestPermission()
  }, [])

  const searchQuery = buildSearchQuery('review-requested', user?.login ?? '')

  useQuery({
    queryKey: ['pr-notifications', user?.login],
    enabled: !!token && !!user && typeof Notification !== 'undefined',
    staleTime: 0,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const data = await createClient(token!).request<SearchPage>(PR_LIST_QUERY, {
        searchQuery,
        cursor: null,
      })
      const prs = data.search.nodes
      const { newIds, nextSeenIds } = computeNewIds(
        prs.map((pr) => pr.id),
        loadSeenIds()
      )
      saveSeenIds(nextSeenIds)
      if (Notification.permission === 'granted') {
        const byId = new Map(prs.map((pr) => [pr.id, pr]))
        for (const id of newIds) {
          const pr = byId.get(id)!
          const notification = new Notification(`Review requested: ${pr.title}`, {
            body: `${pr.repository.nameWithOwner} #${pr.number} by ${pr.author?.login}`,
          })
          notification.onclick = () => window.open(pr.url, '_blank', 'noopener,noreferrer')
        }
      }
      return prs
    },
  })
}
