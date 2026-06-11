import type { PullRequest } from '../types/github'
import type { PRFilters } from '../store/prStore'

export function applyFilters(nodes: PullRequest[], filters: PRFilters): PullRequest[] {
  return nodes.filter((pr) => {
    if (!filters.showHidden && pr.isHidden) return false
    if (
      !filters.showHidden &&
      pr.author &&
      filters.hiddenAuthors.some((p) => pr.author!.login.toLowerCase() === p.toLowerCase())
    )
      return false
    if (!filters.showDrafts && pr.isDraft) return false
    if (filters.repos.length && !filters.repos.includes(pr.repository.nameWithOwner)) return false
    if (filters.search && !pr.title.toLowerCase().includes(filters.search.toLowerCase()))
      return false
    return true
  })
}
