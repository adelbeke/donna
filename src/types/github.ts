export type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING' | 'DISMISSED'
export type MergeableState = 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN'
export type CheckRollupState = 'SUCCESS' | 'FAILURE' | 'PENDING' | 'ERROR' | 'EXPECTED'
export type CheckRunConclusion =
  | 'ACTION_REQUIRED'
  | 'CANCELLED'
  | 'FAILURE'
  | 'NEUTRAL'
  | 'SKIPPED'
  | 'STALE'
  | 'SUCCESS'
  | 'TIMED_OUT'
  | 'STARTUP_FAILURE'
  | null

export type CheckRunContext = {
  __typename: 'CheckRun'
  name: string
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'WAITING' | 'REQUESTED' | 'PENDING'
  conclusion: CheckRunConclusion
  detailsUrl: string | null
}

export type StatusContextItem = {
  __typename: 'StatusContext'
  context: string
  state: CheckRollupState
  targetUrl: string | null
}

export type ReviewRequest = {
  requestedReviewer:
    | { __typename: 'User'; login: string; avatarUrl: string }
    | { __typename: 'Team'; name: string; slug: string }
}

export type Review = {
  state: ReviewState
  author: {
    login: string
    avatarUrl: string
  } | null
  submittedAt: string
}

export type PullRequest = {
  id: string
  number: number
  title: string
  url: string
  isDraft: boolean
  headRefName: string
  createdAt: string
  updatedAt: string
  author: {
    login: string
    avatarUrl: string
  } | null
  repository: {
    name: string
    nameWithOwner: string
    url: string
  }
  reviewRequests: {
    nodes: ReviewRequest[]
  }
  reviews: {
    nodes: Review[]
  }
  additions: number
  deletions: number
  mergeable: MergeableState
  commits: {
    nodes: {
      commit: {
        statusCheckRollup: {
          state: CheckRollupState
          contexts?: { nodes: (CheckRunContext | StatusContextItem)[] }
        } | null
      }
    }[]
  }
  // Derived / local fields (not from API)
  isTopPriority?: boolean
  myReviewState?: ReviewState | null
  isHidden?: boolean
}

export type GitHubUser = {
  login: string
  avatarUrl: string
  name: string
}

export type Branch = {
  name: string
  repo: string
  lastCommitDate: string
  linkedPr?: { number: number; state: string; url: string }
}
