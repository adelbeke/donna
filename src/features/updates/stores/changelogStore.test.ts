import { describe, it, expect, beforeEach } from 'vitest'
import { useChangelogStore } from './changelogStore'

beforeEach(() => {
  useChangelogStore.setState({ lastSeenVersion: null })
})

describe('changelogStore', () => {
  it('starts with no seen version', () => {
    expect(useChangelogStore.getState().lastSeenVersion).toBeNull()
  })

  it('markSeen records the version', () => {
    useChangelogStore.getState().markSeen('v1.2.3')
    expect(useChangelogStore.getState().lastSeenVersion).toBe('v1.2.3')
  })
})
