export type Worktree = {
  path: string
  branch: string
  commit: string
  isMain: boolean
  isDirty: boolean
}

export type Branch = {
  name: string
  // ponytail: true when this branch is checked out in the repo's main worktree
  // (git's `*` marker). A branch checked out in a *linked* worktree is not flagged
  // here — that case is detected via the worktree list instead.
  isCurrent: boolean
}
