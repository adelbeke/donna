// Global augmentation — no imports/exports so TypeScript treats this as a script
declare const __APP_VERSION__: string
interface Window {
  electronAPI?: {
    gh: {
      isInstalled: () => Promise<boolean>
      graphql: (
        query: string,
        variables: Record<string, unknown>
      ) => Promise<{ data: unknown; errors?: { message: string }[] }>
      rest: (path: string) => Promise<unknown>
    }
    branches: {
      list: (repoPath: string) => Promise<import('../features/branches/types').Branch[]>
      delete: (repoPath: string, branch: string) => Promise<void>
      switchToDefault: (repoPath: string) => Promise<void>
    }
    worktrees: {
      list: (repoPath: string) => Promise<import('../features/branches/types').Worktree[]>
      remove: (repoPath: string, worktreePath: string, force: boolean) => Promise<void>
    }
    dirs: {
      filterExisting: (paths: string[]) => Promise<string[]>
    }
    dialog: {
      openDirectory: () => Promise<string | null>
    }
    updater: {
      onUpdateDownloaded: (cb: () => void) => void
      installUpdate: () => Promise<void>
      isUpdateDownloaded: () => Promise<boolean>
    }
  }
}
