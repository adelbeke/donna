import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  gh: {
    isInstalled: (): Promise<boolean> => ipcRenderer.invoke('gh:installed'),
    graphql: (query: string, variables: Record<string, unknown>): Promise<unknown> =>
      ipcRenderer.invoke('gh:graphql', query, variables),
    rest: (path: string): Promise<unknown> => ipcRenderer.invoke('gh:rest', path),
  },
  branches: {
    list: (repoPath: string): Promise<string[]> => ipcRenderer.invoke('branches:list', repoPath),
  },
  worktrees: {
    list: (repoPath: string): Promise<unknown[]> => ipcRenderer.invoke('worktrees:list', repoPath),
  },
  dialog: {
    openDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:open'),
  },
})
