import { describe, it, expect, vi } from 'vitest'
import { createNotificationLifecycleHandlers } from './notificationLifecycle'

describe('createNotificationLifecycleHandlers', () => {
  it('given a notification is dismissed, then it clears unread state and releases it', () => {
    const onClick = vi.fn()
    const onDismiss = vi.fn()
    const release = vi.fn()
    const handlers = createNotificationLifecycleHandlers({ onClick, onDismiss, release })

    handlers.onClose()

    expect(onDismiss).toHaveBeenCalledOnce()
    expect(release).toHaveBeenCalledOnce()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('given a notification is clicked, then it does not treat the later close as a dismiss', () => {
    const onClick = vi.fn()
    const onDismiss = vi.fn()
    const release = vi.fn()
    const handlers = createNotificationLifecycleHandlers({ onClick, onDismiss, release })

    handlers.onClick()
    handlers.onClose()

    expect(onClick).toHaveBeenCalledOnce()
    expect(onDismiss).not.toHaveBeenCalled()
    expect(release).toHaveBeenCalledTimes(2)
  })
})
