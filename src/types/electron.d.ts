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
      delete: (repoPath: string, branch: string, force?: boolean) => Promise<void>
      switchToDefault: (repoPath: string) => Promise<void>
    }
    worktrees: {
      list: (repoPath: string) => Promise<import('../features/branches/types').Worktree[]>
      remove: (repoPath: string, worktreePath: string, force: boolean) => Promise<void>
    }
    dirs: {
      filterExisting: (paths: string[]) => Promise<string[]>
    }
    shortcuts: {
      run: (
        repoPath: string,
        prNumber: number,
        body: string
      ) => Promise<import('../features/shortcuts/types').ShortcutRunResult>
    }
    dialog: {
      openDirectory: () => Promise<string | null>
    }
    updater: {
      onUpdateDownloaded: (cb: () => void) => void
      installUpdate: () => Promise<void>
      isUpdateDownloaded: () => Promise<boolean>
    }
    notifications: {
      updateSettings: (partial: Partial<NotificationSettings>) => Promise<void>
      setActiveSection: (section: NotificationSection | null) => Promise<void>
      pickSound: () => Promise<string | null>
      test: () => Promise<void>
      onNavigate: (cb: (payload: NotificationNavigatePayload) => void) => () => void
    }
  }
}

type NotificationCategory = 'review-requested' | 'assigned' | 'reviewed'
type ChecksSection = 'authored' | 'assigned'
type NotificationSection = NotificationCategory | 'authored'

type NotificationSettings = {
  enabledCategories: NotificationCategory[]
  pollIntervalMs: number
  openPRsInDonna: boolean
  hiddenAuthors: string[]
  hiddenRepos: string[]
  selectedReposByCategory: Record<NotificationSection, string[]>
  showDraftsByCategory: Record<NotificationSection, boolean>
  checksEnabled: Record<ChecksSection, boolean>
  reviewLeftEnabled: Record<ChecksSection, boolean>
  soundName: string | null
  silent: boolean
}

type NotificationNavigatePayload = { route: string } | { section: NotificationCategory }
