import type { CheckRollupState } from '@/types/github'

export type PRFileStatus =
  'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged'

export type PRFile = {
  sha: string
  filename: string
  previous_filename?: string
  status: PRFileStatus
  additions: number
  deletions: number
  changes: number
  patch?: string
  blob_url: string
}

export type DiffSide = 'LEFT' | 'RIGHT'
export type DiffRowType = 'hunk' | 'context' | 'add' | 'del'

export type DiffRow = {
  type: DiffRowType
  // code text WITHOUT the leading +/-/space; for 'hunk', the raw @@ header line
  content: string
  oldLine: number | null // base-side (LEFT) line number
  newLine: number | null // head-side (RIGHT) line number
  noNewline?: true // a '\ No newline at end of file' marker followed this row
}

export type ParsedPatch =
  { kind: 'rows'; rows: DiffRow[]; truncated: boolean } | { kind: 'unavailable' }

export type PRReviewComment = {
  id: string
  body: string
  createdAt: string
  url: string
  author: { login: string; avatarUrl: string } | null
  viewerDidAuthor: boolean
}

export type PRReviewThreadSubjectType = 'LINE' | 'FILE'

export type PRReviewThread = {
  id: string
  path: string
  line: number | null
  originalLine: number | null
  startLine: number | null
  originalStartLine: number | null
  diffSide: DiffSide
  startDiffSide: DiffSide
  isResolved: boolean
  isOutdated: boolean
  isCollapsed: boolean
  subjectType: PRReviewThreadSubjectType
  viewerCanReply: boolean
  viewerCanResolve: boolean
  viewerCanUnresolve: boolean
  resolvedBy: { login: string } | null
  comments: { nodes: PRReviewComment[] }
}

export type PRDetailMeta = {
  id: string
  number: number
  title: string
  url: string
  body: string
  isDraft: boolean
  additions: number
  deletions: number
  createdAt: string
  updatedAt: string
  baseRefName: string
  headRefName: string
  author: { login: string; avatarUrl: string } | null
  repository: { name: string; nameWithOwner: string; url: string }
  commits?: { nodes: { commit: { statusCheckRollup: { state: CheckRollupState } | null } }[] }
}

export type PRKey = { owner: string; repo: string; number: number }

export type CommentMode = 'one-shot' | 'review'

export type PendingReview = { id: string; commentCount: number }

export type PullRequestReviewEvent = 'COMMENT' | 'APPROVE' | 'REQUEST_CHANGES'

export type PRReviewState = 'PENDING' | 'COMMENTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'DISMISSED'

export type PRReview = {
  id: string
  state: PRReviewState
  body: string
  submittedAt: string | null
  author: { login: string; avatarUrl: string } | null
  viewerDidAuthor: boolean
}
