import { describe, it, expect } from 'vitest'
import { expandGapId, mergeExpandedContext, buildFullFileRows } from './expandContext'
import type { DiffRow } from '../types'

const given_gap = (overrides: Partial<DiffRow> = {}): DiffRow => ({
  type: 'expand',
  content: '',
  oldLine: null,
  newLine: null,
  expandCount: null,
  expandAfterOldLine: 0,
  expandAfterNewLine: 0,
  ...overrides,
})

describe('expandGapId', () => {
  it('given two gaps at different anchors, then their ids differ', () => {
    const a = given_gap({ expandAfterNewLine: 2 })
    const b = given_gap({ expandAfterNewLine: 5 })
    expect(expandGapId(a)).not.toBe(expandGapId(b))
  })
})

describe('mergeExpandedContext', () => {
  const rows: DiffRow[] = [
    { type: 'hunk', content: '@@ -10,1 +10,1 @@', oldLine: null, newLine: null },
    given_gap({ expandCount: 9, expandAfterOldLine: 0, expandAfterNewLine: 0 }),
    { type: 'context', content: 'line10', oldLine: 10, newLine: 10 },
  ]
  const blobLines = Array.from({ length: 15 }, (_, i) => `line${i + 1}`)

  it('given no blob loaded, then the expand row is left untouched', () => {
    const actual = mergeExpandedContext(rows, undefined, new Set([expandGapId(rows[1])]))
    expect(actual).toEqual(rows)
  })

  it('given a gap not in the expanded set, then it is left untouched', () => {
    const actual = mergeExpandedContext(rows, blobLines, new Set())
    expect(actual).toEqual(rows)
  })

  it('given a known-count gap in the expanded set, then it is replaced with the right context rows', () => {
    const actual = mergeExpandedContext(rows, blobLines, new Set([expandGapId(rows[1])]))
    expect(actual).toHaveLength(rows.length - 1 + 9)
    expect(actual[1]).toEqual({ type: 'context', content: 'line1', oldLine: 1, newLine: 1 })
    expect(actual[9]).toEqual({ type: 'context', content: 'line9', oldLine: 9, newLine: 9 })
    expect(actual[10]).toEqual(rows[2])
  })

  it('given an open-ended gap, then it expands through the end of the blob', () => {
    const openGap = given_gap({ expandCount: null, expandAfterOldLine: 12, expandAfterNewLine: 12 })
    const actual = mergeExpandedContext([openGap], blobLines, new Set([expandGapId(openGap)]))
    expect(actual).toEqual([
      { type: 'context', content: 'line13', oldLine: 13, newLine: 13 },
      { type: 'context', content: 'line14', oldLine: 14, newLine: 14 },
      { type: 'context', content: 'line15', oldLine: 15, newLine: 15 },
    ])
  })
})

describe('buildFullFileRows', () => {
  const rows: DiffRow[] = [
    { type: 'hunk', content: '@@ -10,1 +10,1 @@', oldLine: null, newLine: null },
    given_gap({ expandCount: 9, expandAfterOldLine: 0, expandAfterNewLine: 0 }),
    { type: 'del', content: 'old line10', oldLine: 10, newLine: null },
    { type: 'add', content: 'line10', oldLine: null, newLine: 10 },
  ]
  const blobLines = Array.from({ length: 15 }, (_, i) => `line${i + 1}`)

  it('given no blob loaded, then it returns no rows and is not truncated', () => {
    expect(buildFullFileRows(rows, undefined)).toEqual({ rows: [], truncated: false })
  })

  it('given a blob, then every gap is expanded and hunk markers are dropped', () => {
    const actual = buildFullFileRows(rows, blobLines)
    expect(actual.truncated).toBe(false)
    expect(actual.rows.some((r) => r.type === 'hunk')).toBe(false)
    expect(actual.rows[0]).toEqual({ type: 'context', content: 'line1', oldLine: 1, newLine: 1 })
    expect(actual.rows.at(-1)).toEqual(rows.at(-1))
  })

  it('given more merged rows than the cap, then the result is truncated', () => {
    const openGap = given_gap({ expandCount: null, expandAfterOldLine: 0, expandAfterNewLine: 0 })
    const hugeBlobLines = Array.from({ length: 5001 }, (_, i) => `line${i + 1}`)
    const actual = buildFullFileRows([openGap], hugeBlobLines)
    expect(actual.truncated).toBe(true)
    expect(actual.rows).toHaveLength(5000)
  })
})
