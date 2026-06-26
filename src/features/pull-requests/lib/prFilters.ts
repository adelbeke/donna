import type { PullRequest } from '@/types/github'
import type { GlobalFilters, ViewFilters } from '../stores/prStore'

export function applyFilters(
  nodes: PullRequest[],
  global: GlobalFilters,
  view: ViewFilters
): PullRequest[] {
  return nodes.filter((pr) => {
    if (!global.showHidden && pr.isHidden) return false
    if (
      !global.showHidden &&
      pr.author &&
      global.hiddenAuthors.some((p) => pr.author!.login.toLowerCase() === p.toLowerCase())
    )
      return false
    if (
      !global.showHidden &&
      global.hiddenRepos.some((r) => {
        const repo = pr.repository.nameWithOwner.toLowerCase()
        // supports "owner/repo" (exact) or "owner" (org-wide)
        return r.includes('/') ? repo === r : repo.split('/')[0] === r
      })
    )
      return false
    if (!view.showDrafts && pr.isDraft) return false
    if (view.repos.length && !view.repos.includes(pr.repository.nameWithOwner)) return false
    if (view.search && !pr.title.toLowerCase().includes(view.search.toLowerCase())) return false
    return true
  })
}
