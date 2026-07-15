import { describe, it, expect } from 'vitest'
import { isNewer } from './useUpdateCheck'

describe('isNewer', () => {
  it('returns true when latest is ahead', () => {
    expect(isNewer('v0.2.0', '0.1.0')).toBe(true)
    expect(isNewer('v0.1.1', '0.1.0')).toBe(true)
    expect(isNewer('v1.0.0', '0.9.9')).toBe(true)
  })

  it('returns false when current is same or ahead', () => {
    expect(isNewer('v0.1.0', '0.1.0')).toBe(false)
    expect(isNewer('v0.1.0', '0.2.0')).toBe(false)
  })
})
