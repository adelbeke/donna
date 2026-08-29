import { describe, it, expect, beforeEach } from 'vitest'
import { useNotificationStore } from './notificationStore'

beforeEach(() => {
  useNotificationStore.setState({
    enabledCategories: ['review-requested', 'assigned'],
    pollIntervalMs: 5 * 60_000,
  })
})

describe('notificationStore', () => {
  it('GIVEN an enabled category WHEN toggled THEN it is removed', () => {
    useNotificationStore.getState().toggleCategory('review-requested')

    expect(useNotificationStore.getState().enabledCategories).toEqual(['assigned'])
  })

  it('GIVEN a disabled category WHEN toggled THEN it is added', () => {
    useNotificationStore.getState().toggleCategory('reviewed')

    expect(useNotificationStore.getState().enabledCategories).toEqual([
      'review-requested',
      'assigned',
      'reviewed',
    ])
  })

  it('GIVEN a poll interval WHEN setPollIntervalMs is called THEN the store updates', () => {
    useNotificationStore.getState().setPollIntervalMs(60_000)

    expect(useNotificationStore.getState().pollIntervalMs).toBe(60_000)
  })
})
