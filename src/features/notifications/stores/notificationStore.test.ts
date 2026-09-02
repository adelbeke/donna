import { describe, it, expect, beforeEach } from 'vitest'
import { useNotificationStore } from './notificationStore'

beforeEach(() => {
  useNotificationStore.setState({
    enabledCategories: ['review-requested', 'assigned'],
    pollIntervalMs: 5 * 60_000,
    checksEnabled: { authored: false, assigned: false },
    reviewLeftEnabled: { authored: false, assigned: false },
    soundName: 'Pop',
    silent: false,
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

  it('GIVEN checks disabled for a section WHEN toggled THEN it is enabled', () => {
    useNotificationStore.getState().toggleChecksEnabled('authored')

    expect(useNotificationStore.getState().checksEnabled).toEqual({
      authored: true,
      assigned: false,
    })
  })

  it('GIVEN checks enabled for a section WHEN toggled twice THEN it is back to disabled', () => {
    useNotificationStore.getState().toggleChecksEnabled('assigned')
    useNotificationStore.getState().toggleChecksEnabled('assigned')

    expect(useNotificationStore.getState().checksEnabled.assigned).toBe(false)
  })

  it('GIVEN review-left disabled for a section WHEN toggled THEN it is enabled', () => {
    useNotificationStore.getState().toggleReviewLeftEnabled('authored')

    expect(useNotificationStore.getState().reviewLeftEnabled).toEqual({
      authored: true,
      assigned: false,
    })
  })

  it('GIVEN review-left enabled for a section WHEN toggled twice THEN it is back to disabled', () => {
    useNotificationStore.getState().toggleReviewLeftEnabled('assigned')
    useNotificationStore.getState().toggleReviewLeftEnabled('assigned')

    expect(useNotificationStore.getState().reviewLeftEnabled.assigned).toBe(false)
  })

  it('GIVEN a sound name WHEN setSoundName is called THEN the store updates', () => {
    useNotificationStore.getState().setSoundName('Glass')

    expect(useNotificationStore.getState().soundName).toBe('Glass')
  })

  it('GIVEN silent is off WHEN toggleSilent is called THEN it is enabled', () => {
    useNotificationStore.getState().toggleSilent()

    expect(useNotificationStore.getState().silent).toBe(true)
  })

  it('GIVEN silent is on WHEN toggled twice THEN it is back to disabled', () => {
    useNotificationStore.getState().toggleSilent()
    useNotificationStore.getState().toggleSilent()

    expect(useNotificationStore.getState().silent).toBe(false)
  })
})
