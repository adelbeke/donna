import { GraphQLClient, ClientError } from 'graphql-request'

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'

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
    search(query: $searchQuery, type: ISSUE, first: 50, after: $cursor) {
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
