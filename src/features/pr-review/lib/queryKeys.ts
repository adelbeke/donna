import type { PRKey } from '../types'

export const prThreadsKey = (k: PRKey) => ['pr-threads', k.owner, k.repo, k.number] as const
export const prFilesKey = (k: PRKey) => ['pr-files', k.owner, k.repo, k.number] as const
export const codeownersKey = (k: PRKey) => ['pr-codeowners', k.owner, k.repo, k.number] as const
export const fileBlobKey = (k: PRKey, headRefOid: string, path: string) =>
  ['pr-file-blob', k.owner, k.repo, headRefOid, path] as const
