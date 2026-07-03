import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { createClient, BRANCHES_QUERY } from '@/providers/github'
import type { Branch } from '@/types/github'

const DEFAULT_BRANCHES = new Set([
  'main',
  'master',
  'develop',
  'development',
  'staging',
  'production',
])

type BranchNode = {
  name: string
  target: {
    committedDate?: string
    author?: { user: { login: string } | null }
  } | null
  associatedPullRequests: { nodes: { number: number; state: string; url: string }[] }
}

type BranchesResult = {
  repository: {
    refs: {
      pageInfo: { hasNextPage: boolean; endCursor: string }
      nodes: BranchNode[]
    }
  }
}

export const mapBranchNodes = (
  nodes: BranchNode[],
  repo: string,
  login: string | undefined
): Branch[] => {
  return nodes
    .filter((n) => !DEFAULT_BRANCHES.has(n.name))
    .filter((n) => {
      if (!n.target?.committedDate) return false
      const authorLogin = n.target.author?.user?.login
      return !login || authorLogin === login
    })
    .map((n): Branch => ({
      name: n.name,
      repo,
      lastCommitDate: n.target!.committedDate!,
      linkedPr: n.associatedPullRequests.nodes[0],
    }))
}

export const useBranches = (repos: string[]) => {
  const token = useAuthStore((s) => s.token)
  const login = useAuthStore((s) => s.user?.login)

  return useQuery<Branch[]>({
    queryKey: ['branches', repos],
    enabled: !!token && repos.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const client = createClient()

      const perRepo = await Promise.all(
        repos.map(async (repo) => {
          const [owner, name] = repo.split('/')
          const nodes: BranchNode[] = []
          let cursor: string | undefined

          for (let page = 0; page < 10; page++) {
            const data = await client.request<BranchesResult>(BRANCHES_QUERY, {
              owner,
              name,
              cursor,
            })
            const { nodes: chunk, pageInfo } = data.repository.refs
            nodes.push(...chunk)
            if (!pageInfo.hasNextPage) break
            if (page === 9) console.warn(`[useBranches] branch pagination cap reached for ${repo}`)
            cursor = pageInfo.endCursor
          }

          return mapBranchNodes(nodes, repo, login)
        })
      )

      return perRepo
        .flat()
        .sort((a, b) => new Date(b.lastCommitDate).getTime() - new Date(a.lastCommitDate).getTime())
    },
  })
}
