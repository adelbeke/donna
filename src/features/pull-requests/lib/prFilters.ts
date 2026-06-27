import type { PullRequest } from '@/types/github'
import type { GlobalFilters, PRSection, ViewFilters } from '../stores/prStore'

// supports "owner/repo" (exact) or "owner" (org-wide)
export const isRepoMatchedBy = (repoNameWithOwner: string, pattern: string): boolean => {
  const repo = repoNameWithOwner.toLowerCase()
  return pattern.includes('/') ? repo === pattern : repo.split('/')[0] === pattern
}

export const applyFilters = (
  nodes: PullRequest[],
  global: GlobalFilters,
  view: ViewFilters,
  section: PRSection
): PullRequest[] => {
  return nodes.filter((pr) => {
    if (!global.showHidden && pr.isHidden) return false
    if (section !== 'authored') {
      if (
        !global.showHidden &&
        pr.author &&
        global.hiddenAuthors.some((p) => pr.author!.login.toLowerCase() === p.toLowerCase())
      )
        return false
      if (
        !global.showHidden &&
        global.hiddenRepos.some((r) => isRepoMatchedBy(pr.repository.nameWithOwner, r))
      )
        return false
    }
    if (!view.showDrafts && pr.isDraft) return false
    if (view.repos.length && !view.repos.includes(pr.repository.nameWithOwner)) return false
    if (view.search && !pr.title.toLowerCase().includes(view.search.toLowerCase())) return false
    return true
  })
}
