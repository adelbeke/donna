import { describe, it, expect } from 'vitest'
import { computeInitialExpansion } from './expansion'
import type { PRFile } from '../types'

const given_file = (filename: string, changes: number): PRFile => ({
  sha: 'abc',
  filename,
  status: 'modified',
  additions: changes,
  deletions: 0,
  changes,
  blob_url: `https://github.com/o/r/blob/sha/${filename}`,
})

describe('computeInitialExpansion', () => {
  it('given a small file, then it starts expanded', () => {
    const actual = computeInitialExpansion([given_file('a.ts', 10)])
    expect(actual.get('a.ts')).toBe(true)
  })

  it('given a file over the change threshold, then it starts collapsed', () => {
    const actual = computeInitialExpansion([given_file('a.ts', 401)])
    expect(actual.get('a.ts')).toBe(false)
  })

  it('given more than 20 small files, then only the first 20 auto-expand', () => {
    const files = Array.from({ length: 25 }, (_, i) => given_file(`f${i}.ts`, 5))
    const actual = computeInitialExpansion(files)
    const expandedCount = [...actual.values()].filter(Boolean).length
    expect(expandedCount).toBe(20)
    expect(actual.get('f0.ts')).toBe(true)
    expect(actual.get('f24.ts')).toBe(false)
  })
})
