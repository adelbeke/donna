export type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING' | 'DISMISSED'

export interface ReviewRequest {
  requestedReviewer:
    | { __typename: 'User'; login: string; avatarUrl: string }
    | { __typename: 'Team'; name: string; slug: string }
}

export interface Review {
  state: ReviewState
  author: {
    login: string
    avatarUrl: string
  }
  submittedAt: string
}

export interface PullRequest {
  id: string
  number: number
  title: string
  url: string
  isDraft: boolean
  createdAt: string
  updatedAt: string
  author: {
    login: string
    avatarUrl: string
  }
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
  // Derived / local fields (not from API)
  isTopPriority?: boolean
  myReviewState?: ReviewState | null
  isHidden?: boolean
}

export interface GitHubUser {
  login: string
  avatarUrl: string
  name: string
}
