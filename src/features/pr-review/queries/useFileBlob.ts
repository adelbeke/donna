import { useQuery } from '@tanstack/react-query'
import { createClient, PR_FILE_BLOB_QUERY } from '@/providers/github'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { fileBlobKey } from '../lib/queryKeys'
import type { PRKey } from '../types'

type BlobResponse = {
  repository: { object: { text: string; isBinary: boolean } | null } | null
}

export type FileBlob = { lines: string[] }

const fetchFileBlob = async (key: PRKey, headRefOid: string, path: string): Promise<FileBlob> => {
  const client = createClient()
  const data = await client.request<BlobResponse>(PR_FILE_BLOB_QUERY, {
    owner: key.owner,
    name: key.repo,
    expression: `${headRefOid}:${path}`,
  })
  const object = data.repository?.object
  if (!object || object.isBinary) return { lines: [] }
  return { lines: object.text.split('\n') }
}

export const useFileBlob = (key: PRKey, headRefOid: string, path: string, enabled: boolean) => {
  const token = useAuthStore((s) => s.token)

  return useQuery<FileBlob>({
    queryKey: fileBlobKey(key, headRefOid, path),
    enabled: !!token && !!headRefOid && enabled,
    staleTime: Infinity, // content at a fixed commit oid never changes
    queryFn: () => fetchFileBlob(key, headRefOid, path),
  })
}
