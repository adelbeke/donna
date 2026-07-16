export const resolveLocalRepoPath = (localPaths: string[], repoName: string): string | null =>
  localPaths.find((p) => p.split('/').pop() === repoName) ?? null
