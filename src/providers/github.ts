import { GraphQLClient, ClientError } from 'graphql-request'
import { IS_NATIVE, ghGraphql, ghRest } from './electron'

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'
const GH_BASE = 'https://api.github.com'

export function isAuthError(error: unknown): boolean {
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

export function createGitHubClient(token: string) {
  return new GraphQLClient(GITHUB_GRAPHQL_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

type GQLClient = { request: <T>(query: string, variables?: Record<string, unknown>) => Promise<T> }

function createElectronClient(): GQLClient {
  return {
    request: async <T>(query: string, variables?: Record<string, unknown>): Promise<T> => {
      const result = await ghGraphql<T>(query, variables ?? {})
      if (result.errors?.length) throw new Error(result.errors[0].message)
      return result.data
    },
  }
}

export function createClient(token?: string | null): GQLClient {
  if (IS_NATIVE) return createElectronClient()
  return createGitHubClient(token!) as unknown as GQLClient
}

export async function restFetch<T>(url: string, token?: string): Promise<T> {
  if (IS_NATIVE) {
    const path = url.startsWith(GH_BASE) ? url.slice(GH_BASE.length) : url
    return ghRest<T>(path)
  }
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token!}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json() as Promise<T>
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

export const PULL_REQUESTS_QUERY = /* GraphQL */ `
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
          author {
            login
            avatarUrl
          }
          repository {
            name
            nameWithOwner
            url
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

export const BRANCHES_QUERY = /* GraphQL */ `
  query GetBranches($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      refs(
        refPrefix: "refs/heads/"
        first: 100
        after: $cursor
        orderBy: { field: TAG_COMMIT_DATE, direction: DESC }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          name
          target {
            ... on Commit {
              committedDate
              author {
                user {
                  login
                }
              }
            }
          }
          associatedPullRequests(first: 1) {
            nodes {
              number
              state
              url
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
