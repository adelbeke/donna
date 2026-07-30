import { useQuery } from '@tanstack/react-query'
import { restFetch } from '@/providers/github'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { codeownersKey } from '../lib/queryKeys'
import { parseCodeowners, type CodeownersRule } from '../lib/codeowners'
import type { PRKey } from '../types'

const CODEOWNERS_PATHS = ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS']

type ContentsResponse = { content: string }

const decodeBase64Utf8 = (base64: string): string => {
  const binary = atob(base64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

// gh api exits non-zero on 404 — most repos have no CODEOWNERS at all, so each candidate path
// is tried in turn and a miss just falls through to the next one rather than surfacing an error.
const fetchCodeowners = async (key: PRKey, baseRef: string): Promise<CodeownersRule[]> => {
  for (const path of CODEOWNERS_PATHS) {
    try {
      const res = await restFetch<ContentsResponse>(
        `/repos/${key.owner}/${key.repo}/contents/${path}?ref=${baseRef}`
      )
      return parseCodeowners(decodeBase64Utf8(res.content))
    } catch {
      continue
    }
  }
  return []
}

export const useCodeowners = (key: PRKey, baseRef: string) => {
  const token = useAuthStore((s) => s.token)

  return useQuery<CodeownersRule[]>({
    queryKey: codeownersKey(key),
    enabled: !!token && !!baseRef,
    staleTime: 5 * 60_000,
    queryFn: () => fetchCodeowners(key, baseRef),
  })
}
