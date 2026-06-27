import { describe, it, expect, vi, afterEach } from 'vitest'
import { timeAgo } from './timeAgo'

const NOW = new Date('2024-06-01T12:00:00Z').getTime()

afterEach(() => vi.useRealTimers())

const freeze = () => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
}

const dateSecondsAgo = (s: number) => {
  return new Date(NOW - s * 1000).toISOString()
}

describe('timeAgo', () => {
  it('GIVEN date 30s ago WHEN called THEN returns Xs ago', () => {
    freeze()
    expect(timeAgo(dateSecondsAgo(30))).toBe('30s ago')
  })

  it('GIVEN date 5m ago WHEN called THEN returns Xm ago', () => {
    freeze()
    expect(timeAgo(dateSecondsAgo(5 * 60))).toBe('5m ago')
  })

  it('GIVEN date 3h ago WHEN called THEN returns Xh ago', () => {
    freeze()
    expect(timeAgo(dateSecondsAgo(3 * 3600))).toBe('3h ago')
  })

  it('GIVEN date 10d ago WHEN called THEN returns Xd ago', () => {
    freeze()
    expect(timeAgo(dateSecondsAgo(10 * 86400))).toBe('10d ago')
  })

  it('GIVEN date 2mo ago WHEN called THEN returns Xmo ago', () => {
    freeze()
    expect(timeAgo(dateSecondsAgo(60 * 86400))).toBe('2mo ago')
  })
})
