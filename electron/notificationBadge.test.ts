import { describe, it, expect, vi } from 'vitest'
import { syncUnreadAppBadge } from './notificationBadge'

describe('syncUnreadAppBadge', () => {
  it('given unread notifications on macOS, then it shows a dot on the app icon', () => {
    const badgeApp = {
      dock: { setBadge: vi.fn() },
      setBadgeCount: vi.fn(),
    }

    syncUnreadAppBadge(badgeApp, 1, 'darwin')

    expect(badgeApp.dock.setBadge).toHaveBeenCalledWith('•')
    expect(badgeApp.setBadgeCount).not.toHaveBeenCalled()
  })

  it('given no unread notifications on macOS, then it clears the app icon badge', () => {
    const badgeApp = {
      dock: { setBadge: vi.fn() },
      setBadgeCount: vi.fn(),
    }

    syncUnreadAppBadge(badgeApp, 0, 'darwin')

    expect(badgeApp.dock.setBadge).toHaveBeenCalledWith('')
  })

  it('given unread notifications off macOS, then it falls back to badge counts', () => {
    const badgeApp = {
      setBadgeCount: vi.fn(),
    }

    syncUnreadAppBadge(badgeApp, 2, 'linux')

    expect(badgeApp.setBadgeCount).toHaveBeenCalledWith(2)
  })
})
