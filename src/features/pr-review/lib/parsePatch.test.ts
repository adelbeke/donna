import { describe, it, expect } from 'vitest'
import { parsePatch, unavailableReason } from './parsePatch'
import type { PRFile } from '../types'

const given_file = (overrides: Partial<PRFile> = {}): PRFile => ({
  sha: 'abc',
  filename: 'src/foo.ts',
  status: 'modified',
  additions: 0,
  deletions: 0,
  changes: 0,
  blob_url: 'https://github.com/o/r/blob/sha/src/foo.ts',
  ...overrides,
})

describe('parsePatch', () => {
  it('given no patch, when parsed, then unavailable', () => {
    expect(parsePatch(undefined)).toEqual({ kind: 'unavailable' })
  })

  it('given an empty patch, when parsed, then unavailable', () => {
    expect(parsePatch('')).toEqual({ kind: 'unavailable' })
  })

  it('given an all-context hunk, when parsed, then cursors advance in lockstep', () => {
    const actual = parsePatch('@@ -1,2 +1,2 @@\n a\n b')
    expect(actual).toEqual({
      kind: 'rows',
      truncated: false,
      rows: [
        { type: 'hunk', content: '@@ -1,2 +1,2 @@', oldLine: null, newLine: null },
        { type: 'context', content: 'a', oldLine: 1, newLine: 1 },
        { type: 'context', content: 'b', oldLine: 2, newLine: 2 },
        {
          type: 'expand',
          content: '',
          oldLine: null,
          newLine: null,
          expandCount: null,
          expandAfterOldLine: 2,
          expandAfterNewLine: 2,
        },
      ],
    })
  })

  it('given an addition-only hunk, when parsed, then oldLine is always null', () => {
    const actual = parsePatch('@@ -1,0 +1,2 @@\n+a\n+b')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows.slice(1, 3)).toEqual([
      { type: 'add', content: 'a', oldLine: null, newLine: 1 },
      { type: 'add', content: 'b', oldLine: null, newLine: 2 },
    ])
  })

  it('given a deletion-only hunk, when parsed, then newLine is always null', () => {
    const actual = parsePatch('@@ -1,2 +1,0 @@\n-a\n-b')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows.slice(1, 3)).toEqual([
      { type: 'del', content: 'a', oldLine: 1, newLine: null },
      { type: 'del', content: 'b', oldLine: 2, newLine: null },
    ])
  })

  it('given a mixed add/del/context hunk, when parsed, then each row has the correct tuple', () => {
    const actual = parsePatch('@@ -1,3 +1,3 @@\n a\n-b\n+c\n d')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    const tuples = actual.rows.map((r) => [r.type, r.oldLine, r.newLine])
    expect(tuples).toEqual([
      ['hunk', null, null],
      ['context', 1, 1],
      ['del', 2, null],
      ['add', null, 2],
      ['context', 3, 3],
      ['expand', null, null],
    ])
  })

  it('given a hunk header with no counts, when parsed, then cursors start at the single number', () => {
    const actual = parsePatch('@@ -1 +1 @@\n a')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows[1]).toEqual({ type: 'context', content: 'a', oldLine: 1, newLine: 1 })
  })

  it('given a hunk header with trailing section context, when parsed, then it stays in the hunk row content', () => {
    const actual = parsePatch('@@ -10,7 +10,7 @@ export const foo = () => {\n a')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows[1]).toEqual({
      type: 'hunk',
      content: '@@ -10,7 +10,7 @@ export const foo = () => {',
      oldLine: null,
      newLine: null,
    })
  })

  it('given two hunks, when parsed, then cursors reset per hunk', () => {
    const actual = parsePatch('@@ -1,1 +1,1 @@\n a\n@@ -90,1 +90,1 @@\n b')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows.map((r) => [r.type, r.oldLine, r.newLine])).toEqual([
      ['hunk', null, null],
      ['context', 1, 1],
      ['expand', null, null],
      ['hunk', null, null],
      ['context', 90, 90],
      ['expand', null, null],
    ])
  })

  it('given a no-newline marker after an addition, when parsed, then it flags that row and adds no row', () => {
    const actual = parsePatch('@@ -1,0 +1,1 @@\n+a\n\\ No newline at end of file')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows).toHaveLength(3)
    expect(actual.rows[1]).toEqual({
      type: 'add',
      content: 'a',
      oldLine: null,
      newLine: 1,
      noNewline: true,
    })
  })

  it('given a whitespace-stripped empty context line, when parsed, then treated as context and both cursors advance', () => {
    const actual = parsePatch('@@ -1,2 +1,2 @@\n\n a')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows[1]).toEqual({ type: 'context', content: '', oldLine: 1, newLine: 1 })
    expect(actual.rows[2]).toEqual({ type: 'context', content: 'a', oldLine: 2, newLine: 2 })
  })

  it('given an addition whose content itself starts with +, when parsed, then only the marker is stripped', () => {
    const actual = parsePatch('@@ -1,0 +1,1 @@\n+++x')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows[1]).toEqual({ type: 'add', content: '++x', oldLine: null, newLine: 1 })
  })

  it('given a patch with a trailing newline, when parsed, then there is no phantom empty row', () => {
    const actual = parsePatch('@@ -1,1 +1,1 @@\n a\n')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows).toHaveLength(3)
  })

  it('given garbage lines before the first hunk, when parsed, then they are skipped without throwing', () => {
    const actual = parsePatch(
      'diff --git a/x b/x\nindex 123..456\n--- a/x\n+++ b/x\n@@ -1,1 +1,1 @@\n a'
    )
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows).toHaveLength(3)
    expect(actual.rows[0].type).toBe('hunk')
  })

  it('given a patch exceeding the row cap, when parsed, then it truncates and adds no trailing gap', () => {
    const body = Array.from({ length: 2500 }, (_, i) => ` line${i}`).join('\n')
    const actual = parsePatch(`@@ -1,2500 +1,2500 @@\n${body}`)
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows).toHaveLength(2000)
    expect(actual.truncated).toBe(true)
  })

  it('given a hunk that starts after line 1, when parsed, then a top expand gap is inserted', () => {
    const actual = parsePatch('@@ -10,1 +10,1 @@\n a')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows[0]).toEqual({
      type: 'expand',
      content: '',
      oldLine: null,
      newLine: null,
      expandCount: 9,
      expandAfterOldLine: 0,
      expandAfterNewLine: 0,
    })
    expect(actual.rows[1].type).toBe('hunk')
  })

  it('given a hunk that starts at line 1, when parsed, then no top expand gap is inserted', () => {
    const actual = parsePatch('@@ -1,1 +1,1 @@\n a')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows[0].type).toBe('hunk')
  })

  it('given two hunks with a gap between them, when parsed, then the gap expand row has the right count and anchors', () => {
    const actual = parsePatch('@@ -1,2 +1,2 @@\n a\n b\n@@ -20,1 +20,1 @@\n c')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    const gap = actual.rows.find((r, i) => r.type === 'expand' && i !== actual.rows.length - 1)
    expect(gap).toEqual({
      type: 'expand',
      content: '',
      oldLine: null,
      newLine: null,
      expandCount: 17,
      expandAfterOldLine: 2,
      expandAfterNewLine: 2,
    })
  })

  it('given adjacent hunks with no gap between them, when parsed, then no expand row is inserted between them', () => {
    const actual = parsePatch('@@ -1,1 +1,1 @@\n a\n@@ -2,1 +2,1 @@\n b')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows.map((r) => r.type)).toEqual(['hunk', 'context', 'hunk', 'context', 'expand'])
  })

  it('given a hunk, when parsed, then a bottom expand gap with unknown count is appended', () => {
    const actual = parsePatch('@@ -1,1 +1,1 @@\n a')
    expect(actual.kind).toBe('rows')
    if (actual.kind !== 'rows') return
    expect(actual.rows[actual.rows.length - 1]).toEqual({
      type: 'expand',
      content: '',
      oldLine: null,
      newLine: null,
      expandCount: null,
      expandAfterOldLine: 1,
      expandAfterNewLine: 1,
    })
  })
})

describe('unavailableReason', () => {
  it('given a rename with no content change, then rename-only', () => {
    expect(unavailableReason(given_file({ status: 'renamed', changes: 0 }))).toBe('rename-only')
  })

  it('given a copy with no content change, then rename-only', () => {
    expect(unavailableReason(given_file({ status: 'copied', changes: 0 }))).toBe('rename-only')
  })

  it('given a modified file, then binary-or-large', () => {
    expect(unavailableReason(given_file({ status: 'modified', changes: 5 }))).toBe(
      'binary-or-large'
    )
  })
})
