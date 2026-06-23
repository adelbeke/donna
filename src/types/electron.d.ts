// Global augmentation — no imports/exports so TypeScript treats this as a script
interface Window {
  electronAPI?: {
    gh: {
      isInstalled: () => Promise<boolean>
      graphql: (query: string, variables: Record<string, unknown>) => Promise<{ data: unknown; errors?: { message: string }[] }>
      rest: (path: string) => Promise<unknown>
    }
    branches: {
      list: (repoPath: string) => Promise<string[]>
    }
    worktrees: {
      list: (repoPath: string) => Promise<import('./worktree').Worktree[]>
    }
    dialog: {
      openDirectory: () => Promise<string | null>
    }
  }
}
