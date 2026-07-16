import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  gh: {
    isInstalled: (): Promise<boolean> => ipcRenderer.invoke('gh:installed'),
    graphql: (query: string, variables: Record<string, unknown>): Promise<unknown> =>
      ipcRenderer.invoke('gh:graphql', query, variables),
    rest: (path: string): Promise<unknown> => ipcRenderer.invoke('gh:rest', path),
  },
  branches: {
    list: (repoPath: string): Promise<import('../src/features/branches/types').Branch[]> =>
      ipcRenderer.invoke('branches:list', repoPath),
    delete: (repoPath: string, branch: string): Promise<void> =>
      ipcRenderer.invoke('branches:delete', repoPath, branch),
    switchToDefault: (repoPath: string): Promise<void> =>
      ipcRenderer.invoke('branches:switchToDefault', repoPath),
  },
  worktrees: {
    list: (repoPath: string): Promise<unknown[]> => ipcRenderer.invoke('worktrees:list', repoPath),
    remove: (repoPath: string, worktreePath: string, force: boolean): Promise<void> =>
      ipcRenderer.invoke('worktrees:remove', repoPath, worktreePath, force),
  },
  dirs: {
    filterExisting: (paths: string[]): Promise<string[]> =>
      ipcRenderer.invoke('dirs:filter-existing', paths),
  },
  shortcuts: {
    run: (
      repoPath: string,
      prNumber: number,
      body: string
    ): Promise<import('../src/features/shortcuts/types').ShortcutRunResult> =>
      ipcRenderer.invoke('shortcuts:run', repoPath, prNumber, body),
  },
  dialog: {
    openDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:open'),
  },
  updater: {
    onUpdateDownloaded: (cb: () => void) => ipcRenderer.on('update:downloaded', cb),
    installUpdate: (): Promise<void> => ipcRenderer.invoke('update:install'),
    isUpdateDownloaded: (): Promise<boolean> => ipcRenderer.invoke('update:is-downloaded'),
  },
})
