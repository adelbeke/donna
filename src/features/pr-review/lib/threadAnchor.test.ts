import { describe, it, expect } from 'vitest'
import {
  rowKey,
  rowKeys,
  commentTargetForRow,
  groupThreadsByPath,
  anchorThreadsToRows,
} from './threadAnchor'
import type { DiffRow, PRFile, PRReviewThread } from '../types'

const given_thread = (overrides: Partial<PRReviewThread> = {}): PRReviewThread => ({
  id: 't1',
  path: 'src/foo.ts',
  line: 5,
  originalLine: null,
  startLine: null,
  originalStartLine: null,
  diffSide: 'RIGHT',
  startDiffSide: 'RIGHT',
  isResolved: false,
  isOutdated: false,
  isCollapsed: false,
  subjectType: 'LINE',
  viewerCanReply: true,
  viewerCanResolve: true,
  viewerCanUnresolve: false,
  resolvedBy: null,
  comments: { nodes: [] },
  ...overrides,
})

const given_file = (overrides: Partial<PRFile> = {}): PRFile => ({
  sha: 'abc',
  filename: 'src/foo.ts',
  status: 'modified',
  additions: 1,
  deletions: 1,
  changes: 2,
  blob_url: 'https://github.com/o/r/blob/sha/src/foo.ts',
  ...overrides,
})

describe('rowKey', () => {
  it('given the same line on different sides, then keys differ', () => {
    expect(rowKey('LEFT', 5)).not.toBe(rowKey('RIGHT', 5))
  })
})

describe('rowKeys', () => {
  it('given an addition row, then one RIGHT key', () => {
    const row: DiffRow = { type: 'add', content: 'x', oldLine: null, newLine: 3 }
    expect(rowKeys(row)).toEqual([rowKey('RIGHT', 3)])
  })

  it('given a deletion row, then one LEFT key', () => {
    const row: DiffRow = { type: 'del', content: 'x', oldLine: 3, newLine: null }
    expect(rowKeys(row)).toEqual([rowKey('LEFT', 3)])
  })

  it('given a context row, then both LEFT and RIGHT keys', () => {
    const row: DiffRow = { type: 'context', content: 'x', oldLine: 3, newLine: 4 }
    expect(rowKeys(row)).toEqual([rowKey('RIGHT', 4), rowKey('LEFT', 3)])
  })

  it('given a hunk row, then no keys', () => {
    const row: DiffRow = { type: 'hunk', content: '@@ -1 +1 @@', oldLine: null, newLine: null }
    expect(rowKeys(row)).toEqual([])
  })
})

describe('commentTargetForRow', () => {
  it('given an addition row, then RIGHT/newLine', () => {
    const row: DiffRow = { type: 'add', content: 'x', oldLine: null, newLine: 3 }
    expect(commentTargetForRow(row)).toEqual({ side: 'RIGHT', line: 3 })
  })

  it('given a context row, then RIGHT/newLine', () => {
    const row: DiffRow = { type: 'context', content: 'x', oldLine: 2, newLine: 3 }
    expect(commentTargetForRow(row)).toEqual({ side: 'RIGHT', line: 3 })
  })

  it('given a deletion row, then LEFT/oldLine', () => {
    const row: DiffRow = { type: 'del', content: 'x', oldLine: 2, newLine: null }
    expect(commentTargetForRow(row)).toEqual({ side: 'LEFT', line: 2 })
  })

  it('given a hunk row, then null', () => {
    const row: DiffRow = { type: 'hunk', content: '@@ -1 +1 @@', oldLine: null, newLine: null }
    expect(commentTargetForRow(row)).toBeNull()
  })
})

describe('anchorThreadsToRows', () => {
  const rows: DiffRow[] = [
    { type: 'hunk', content: '@@ -1,3 +1,3 @@', oldLine: null, newLine: null },
    { type: 'context', content: 'a', oldLine: 1, newLine: 1 },
    { type: 'del', content: 'b', oldLine: 2, newLine: null },
    { type: 'add', content: 'c', oldLine: null, newLine: 2 },
    { type: 'context', content: 'd', oldLine: 3, newLine: 3 },
  ]

  it('given a thread on an addition row, then placed on that row', () => {
    const thread = given_thread({ line: 2, diffSide: 'RIGHT' })
    const actual = anchorThreadsToRows([thread], rows)
    expect(actual.byRow.get(rowKey('RIGHT', 2))).toEqual([thread])
    expect(actual.unanchored).toEqual([])
  })

  it('given a thread on a deletion row (LEFT side), then placed on that row', () => {
    const thread = given_thread({ line: 2, diffSide: 'LEFT' })
    const actual = anchorThreadsToRows([thread], rows)
    expect(actual.byRow.get(rowKey('LEFT', 2))).toEqual([thread])
  })

  it('given a thread with diffSide LEFT on a context row, then placed via the dual key', () => {
    const thread = given_thread({ line: 1, diffSide: 'LEFT' })
    const actual = anchorThreadsToRows([thread], rows)
    expect(actual.byRow.get(rowKey('LEFT', 1))).toEqual([thread])
  })

  it('given a thread line outside every hunk, then unanchored', () => {
    const thread = given_thread({ line: 999, diffSide: 'RIGHT' })
    const actual = anchorThreadsToRows([thread], rows)
    expect(actual.unanchored).toEqual([thread])
    expect(actual.byRow.size).toBe(0)
  })

  it('given an outdated thread, then unanchored and never placed on its originalLine row', () => {
    const thread = given_thread({
      line: null,
      originalLine: 1,
      diffSide: 'RIGHT',
      isOutdated: true,
    })
    const actual = anchorThreadsToRows([thread], rows)
    expect(actual.unanchored).toEqual([thread])
    expect(actual.byRow.get(rowKey('RIGHT', 1))).toBeUndefined()
  })

  it('given a non-outdated thread with null line but a valid originalLine, then placed', () => {
    const thread = given_thread({ line: null, originalLine: 3, diffSide: 'RIGHT' })
    const actual = anchorThreadsToRows([thread], rows)
    expect(actual.byRow.get(rowKey('RIGHT', 3))).toEqual([thread])
  })

  it('given a FILE-level thread, then fileLevel', () => {
    const thread = given_thread({ subjectType: 'FILE', line: null })
    const actual = anchorThreadsToRows([thread], rows)
    expect(actual.fileLevel).toEqual([thread])
    expect(actual.unanchored).toEqual([])
  })

  it('given two threads on the same row, then both kept in API order', () => {
    const first = given_thread({ id: 't1', line: 2, diffSide: 'RIGHT' })
    const second = given_thread({ id: 't2', line: 2, diffSide: 'RIGHT' })
    const actual = anchorThreadsToRows([first, second], rows)
    expect(actual.byRow.get(rowKey('RIGHT', 2))).toEqual([first, second])
  })
})

describe('groupThreadsByPath', () => {
  it('given a thread on a renamed file previous_filename, then grouped under the current filename', () => {
    const files = [given_file({ filename: 'new.ts', previous_filename: 'old.ts' })]
    const thread = given_thread({ path: 'old.ts' })
    const actual = groupThreadsByPath([thread], files)
    expect(actual.get('new.ts')).toEqual([thread])
    expect(actual.has('old.ts')).toBe(false)
  })

  it('given a thread whose path matches no file, then grouped under its own path', () => {
    const thread = given_thread({ path: 'gone.ts' })
    const actual = groupThreadsByPath([thread], [])
    expect(actual.get('gone.ts')).toEqual([thread])
  })
})
