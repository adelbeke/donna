import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { spawn, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'

const execFileAsync = promisify(execFile)

// ponytail: augment PATH so macOS .app bundles find gh via Homebrew/nix paths
const GH_PATH = [
  '/opt/homebrew/bin',
  '/usr/local/bin',
  '/usr/bin',
  process.env.PATH,
].filter(Boolean).join(':')

function runGh(args: string[], stdinData?: string): Promise<string> {
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

ipcMain.handle('worktrees:list', async (_e, repoPath: string) => {
  const { stdout } = await execFileAsync('git', ['-C', repoPath, 'worktree', 'list', '--porcelain'])
  return parseWorktrees(stdout)
})

ipcMain.handle('dialog:open', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return canceled ? null : filePaths[0]
})

type WorktreeRecord = { worktree?: string; HEAD?: string; branch?: string; detached?: string }

function parseWorktrees(output: string) {
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

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
    },
  })

  if (!app.isPackaged) {
    const url = 'http://localhost:5173/donna/'
    win.webContents.on('did-fail-load', () => setTimeout(() => win.loadURL(url), 500))
    win.loadURL(url)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
