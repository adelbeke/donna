import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import { spawn, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import fs from 'node:fs'

const execFileAsync = promisify(execFile)

// ponytail: augment PATH so macOS .app bundles find gh via Homebrew/nix paths
const GH_PATH = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', process.env.PATH]
  .filter(Boolean)
  .join(':')

const runGh = (args: string[], stdinData?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const proc = spawn('gh', args, { env: { ...process.env, PATH: GH_PATH } })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d: Buffer) => (stdout += d.toString()))
    proc.stderr.on('data', (d: Buffer) => (stderr += d.toString()))
    proc.on('close', (code: number | null) => {
      if (code === 0) resolve(stdout)
      else reject(new Error(stderr || `gh exited with code ${code}`))
    })
    proc.on('error', reject)
    if (stdinData) proc.stdin.write(stdinData)
    proc.stdin.end()
  })
}

ipcMain.handle('gh:installed', async () => {
  try {
    await execFileAsync('gh', ['--version'], { env: { ...process.env, PATH: GH_PATH } })
    return true
  } catch {
    return false
  }
})

ipcMain.handle('gh:graphql', async (_e, query: string, variables: Record<string, unknown>) => {
  const body = JSON.stringify({ query, variables })
  const out = await runGh(['api', 'graphql', '--input', '-'], body)
  return JSON.parse(out)
})

ipcMain.handle('gh:rest', async (_e, endpoint: string) => {
  const out = await runGh(['api', endpoint])
  return JSON.parse(out)
})

const gitError = (e: unknown): Error => {
  const stderr = (e as { stderr?: string }).stderr?.trim()
  const msg = stderr || (e as Error).message || String(e)
  return new Error(msg.split('\n')[0])
}

ipcMain.handle('worktrees:list', async (_e, repoPath: string) => {
  try {
    const { stdout } = await execFileAsync('git', [
      '-C',
      repoPath,
      'worktree',
      'list',
      '--porcelain',
    ])
    const worktrees = parseWorktrees(stdout)
    return await Promise.all(
      worktrees.map(async (wt) => {
        try {
          const { stdout: status } = await execFileAsync('git', [
            '-C',
            wt.path,
            'status',
            '--porcelain',
          ])
          return { ...wt, isDirty: status.trim().length > 0 }
        } catch {
          return { ...wt, isDirty: false }
        }
      })
    )
  } catch (e) {
    throw gitError(e)
  }
})

ipcMain.handle('branches:list', async (_e, repoPath: string) => {
  try {
    // %(HEAD) emits '*' for the branch checked out in this (main) worktree, ' ' otherwise.
    const { stdout } = await execFileAsync('git', [
      '-C',
      repoPath,
      'branch',
      '--format=%(HEAD)\t%(refname:short)',
    ])
    return stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const tabIdx = line.indexOf('\t')
        return { name: line.slice(tabIdx + 1), isCurrent: line.slice(0, tabIdx) === '*' }
        // ponytail: drop the detached-HEAD pseudo-entry ("(HEAD detached at …)") — not a real, switchable branch.
      })
      .filter((b) => !b.name.startsWith('('))
  } catch (e) {
    throw gitError(e)
  }
})

ipcMain.handle('branches:switchToDefault', async (_e, repoPath: string) => {
  try {
    await execFileAsync('git', ['-C', repoPath, 'switch', 'main'])
  } catch {
    try {
      await execFileAsync('git', ['-C', repoPath, 'switch', 'master'])
    } catch (e) {
      throw gitError(e)
    }
  }
})

ipcMain.handle('branches:delete', async (_e, repoPath: string, branch: string) => {
  try {
    await execFileAsync('git', ['-C', repoPath, 'branch', '-d', branch])
  } catch (e) {
    throw gitError(e)
  }
})

ipcMain.handle(
  'worktrees:remove',
  async (_e, repoPath: string, worktreePath: string, force: boolean) => {
    try {
      const args = ['-C', repoPath, 'worktree', 'remove', worktreePath]
      if (force) args.splice(4, 0, '--force')
      await execFileAsync('git', args)
    } catch (e) {
      throw gitError(e)
    }
  }
)

ipcMain.handle('dialog:open', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return canceled ? null : filePaths[0]
})

type WorktreeRecord = { worktree?: string; HEAD?: string; branch?: string; detached?: string }

const parseWorktrees = (output: string) => {
  const results: WorktreeRecord[] = []
  let current: WorktreeRecord = {}
  for (const line of output.split('\n')) {
    if (line === '') {
      if (current.worktree) results.push(current)
      current = {}
    } else {
      const spaceIdx = line.indexOf(' ')
      const key = spaceIdx === -1 ? line : line.slice(0, spaceIdx)
      const val = spaceIdx === -1 ? '' : line.slice(spaceIdx + 1)
      current[key as keyof WorktreeRecord] = val
    }
  }
  if (current.worktree) results.push(current)

  return results.map((w, i) => ({
    path: w.worktree!,
    branch: w.branch?.replace('refs/heads/', '') ?? '',
    commit: (w.HEAD ?? '').slice(0, 8),
    isMain: i === 0,
  }))
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (!app.isPackaged) {
    const url = 'http://localhost:5173/donna/'
    win.webContents.on('did-fail-load', () => setTimeout(() => win.loadURL(url), 500))
    win.loadURL(url)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle('dirs:filter-existing', async (_e, paths: string[]) => {
  if (!Array.isArray(paths)) return []
  const results = await Promise.all(
    paths.map((p) =>
      fs.promises
        .access(p)
        .then(() => p)
        .catch(() => null)
    )
  )
  return results.filter((p): p is string => p !== null)
})

ipcMain.handle('update:install', () => autoUpdater.quitAndInstall())
// ponytail: flag so the banner can catch updates downloaded before it mounts
let updateDownloaded = false
ipcMain.handle('update:is-downloaded', () => updateDownloaded)

app.whenReady().then(() => {
  createWindow()
  if (app.isPackaged) {
    // ponytail: error listener required — Node throws on unhandled 'error' events
    autoUpdater.on('error', (err) => console.error('[updater]', err.message))
    autoUpdater.on('update-downloaded', () => {
      updateDownloaded = true
      BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('update:downloaded'))
    })
    autoUpdater.checkForUpdates()?.catch((err) => console.error('[updater]', err.message))
  }
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
