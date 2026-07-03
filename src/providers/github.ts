import { ClientError } from 'graphql-request'
import { ghGraphql, ghRest } from './electron'

export const isAuthError = (error: unknown): boolean => {
  if (error instanceof ClientError) {
    const status = error.response?.status
    if (status === 401 || status === 403) return true
    return (error.response?.errors ?? []).some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => e.type === 'FORBIDDEN' || /bad credentials/i.test(e.message ?? '')
    )
  }
  return false
}

type GQLClient = { request: <T>(query: string, variables?: Record<string, unknown>) => Promise<T> }

const createElectronClient = (): GQLClient => {
  return {
    request: async <T>(query: string, variables?: Record<string, unknown>): Promise<T> => {
      const result = await ghGraphql<T>(query, variables ?? {})
      if (result.errors?.length) throw new Error(result.errors[0].message)
      return result.data
    },
  }
}

export const createClient = (): GQLClient => createElectronClient()

export const restFetch = async <T>(url: string): Promise<T> => {
  const GH_BASE = 'https://api.github.com'
  const path = url.startsWith(GH_BASE) ? url.slice(GH_BASE.length) : url
  return ghRest<T>(path)
}

export const VIEWER_QUERY = /* GraphQL */ `
  query GetViewer {
    viewer {
      login
      avatarUrl
      name
    }
  }
`

export const PR_LIST_QUERY = /* GraphQL */ `
  query GetPullRequests($searchQuery: String!, $cursor: String) {
    search(query: $searchQuery, type: ISSUE, first: 20, after: $cursor) {
      issueCount
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on PullRequest {
          id
          number
          title
          url
          isDraft
          headRefName
          createdAt
          updatedAt
          additions
          deletions
          author {
            login
            avatarUrl
          }
          repository {
            name
            nameWithOwner
            url
          }
        }
      }
    }
  }
`

export const PR_DETAILS_SINGLE_QUERY = /* GraphQL */ `
  query GetPRDetails($nodeId: ID!) {
    node(id: $nodeId) {
      ... on PullRequest {
        id
        mergeable
        commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                state
              }
            }
          }
        }
        reviewRequests(first: 10) {
          nodes {
            requestedReviewer {
              __typename
              ... on User {
                login
                avatarUrl
              }
              ... on Team {
                name
                slug
              }
            }
          }
        }
        reviews(first: 20) {
          nodes {
            state
            submittedAt
            author {
              login
              avatarUrl
            }
          }
        }
      }
    }
  }
`

export const PR_CHECK_CONTEXTS_QUERY = /* GraphQL */ `
  query GetPRCheckContexts($nodeId: ID!) {
    node(id: $nodeId) {
      ... on PullRequest {
        commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                contexts(first: 100) {
                  nodes {
                    __typename
                    ... on CheckRun {
                      name
                      status
                      conclusion
                      detailsUrl
                    }
                    ... on StatusContext {
                      context
                      state
                      targetUrl
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

export const VIEWER_TEAMS_QUERY = /* GraphQL */ `
  query GetViewerTeams {
    viewer {
      organizations(first: 20) {
        nodes {
          teams(first: 50, userLogins: [$login]) {
            nodes {
              name
              slug
            }
          }
        }
      }
    }
  }
`
