type BadgeApp = {
  setBadgeCount: (count: number) => boolean
  dock?: { setBadge: (text: string) => void }
}

export const syncUnreadAppBadge = (
  badgeApp: BadgeApp,
  unreadCount: number,
  platform = process.platform
) => {
  if (platform === 'darwin' && badgeApp.dock) {
    badgeApp.dock.setBadge(unreadCount > 0 ? '•' : '')
    return
  }

  badgeApp.setBadgeCount(Math.max(0, unreadCount))
}
