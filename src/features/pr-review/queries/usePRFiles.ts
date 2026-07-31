import { useQuery } from '@tanstack/react-query'
import { restFetch } from '@/providers/github'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { prFilesKey } from '../lib/queryKeys'
import type { PRFile, PRKey } from '../types'

const PER_PAGE = 100
const MAX_PAGES = 5 // 500-file ceiling, matching the app's bounded-pagination convention

export type PRFilesResult = { files: PRFile[]; truncated: boolean }

const fetchAllFiles = async (key: PRKey): Promise<PRFilesResult> => {
  const files: PRFile[] = []
  let truncated = false

  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await restFetch<PRFile[]>(
      `/repos/${key.owner}/${key.repo}/pulls/${key.number}/files?per_page=${PER_PAGE}&page=${page}`
    )
    files.push(...batch)
    if (batch.length < PER_PAGE) break
    if (page === MAX_PAGES) truncated = true
  }

  return { files, truncated }
}

export const usePRFiles = (key: PRKey) => {
  const token = useAuthStore((s) => s.token)

  return useQuery<PRFilesResult>({
    queryKey: prFilesKey(key),
    enabled: !!token && !!key.owner && !!key.repo && Number.isFinite(key.number),
    staleTime: 60_000,
    queryFn: () => fetchAllFiles(key),
  })
}
