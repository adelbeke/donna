import { describe, it, expect } from 'vitest'
import { computeNewIds } from './prNotifications'

describe('computeNewIds', () => {
  it('seeds silently on first run instead of reporting all ids as new', () => {
    const actual = computeNewIds(['a', 'b'], null)
    expect(actual).toEqual({ newIds: [], nextSeenIds: ['a', 'b'] })
  })

  it('reports only ids absent from the previous snapshot', () => {
    const actual = computeNewIds(['a', 'b', 'c'], ['a', 'b'])
    expect(actual).toEqual({ newIds: ['c'], nextSeenIds: ['a', 'b', 'c'] })
  })

  it('reports no new ids when nothing changed', () => {
    const actual = computeNewIds(['a', 'b'], ['a', 'b'])
    expect(actual).toEqual({ newIds: [], nextSeenIds: ['a', 'b'] })
  })

  it('drops ids that disappeared (closed/merged) from the next snapshot', () => {
    const actual = computeNewIds(['b'], ['a', 'b'])
    expect(actual).toEqual({ newIds: [], nextSeenIds: ['b'] })
  })
})
