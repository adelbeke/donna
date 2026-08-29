import { app, ipcMain, BrowserWindow } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

export type NotificationCategory = 'review-requested' | 'assigned' | 'reviewed'

export type NotificationSettings = {
  enabledCategories: NotificationCategory[]
  pollIntervalMs: number
  openPRsInDonna: boolean
}

export type NotificationNavigatePayload = { route: string } | { section: NotificationCategory }

const DEFAULT_SETTINGS: NotificationSettings = {
  enabledCategories: ['review-requested', 'assigned'],
  pollIntervalMs: 5 * 60_000,
  openPRsInDonna: true,
}

const storePath = () => path.join(app.getPath('userData'), 'notifications.json')

const loadSettings = (): NotificationSettings => {
  try {
    const raw = fs.readFileSync(storePath(), 'utf-8')
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

const saveSettings = (settings: NotificationSettings) => {
  fs.writeFileSync(storePath(), JSON.stringify(settings, null, 2))
}

let settings: NotificationSettings = DEFAULT_SETTINGS
let pollTimer: NodeJS.Timeout | null = null

// ponytail: detection (new-PR / CI-failed / review-left) lands in a later PR — this tick is a
// no-op placeholder so the interval is wired and restartable before any GitHub call exists.
const tick = () => {}

const startPolling = () => {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(tick, settings.pollIntervalMs)
}

export const initNotifications = () => {
  settings = loadSettings()
  startPolling()

  ipcMain.handle('notifications:updateSettings', (_e, partial: Partial<NotificationSettings>) => {
    settings = { ...settings, ...partial }
    saveSettings(settings)
    startPolling()
  })
}

export const sendNavigate = (payload: NotificationNavigatePayload) => {
  BrowserWindow.getAllWindows().forEach((w) =>
    w.webContents.send('notifications:navigate', payload)
  )
}
