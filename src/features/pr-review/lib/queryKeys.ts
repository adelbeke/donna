import type { PRKey } from '../types'

export const prThreadsKey = (k: PRKey) => ['pr-threads', k.owner, k.repo, k.number] as const
export const prFilesKey = (k: PRKey) => ['pr-files', k.owner, k.repo, k.number] as const
