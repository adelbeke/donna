import { describe, it, expect } from 'vitest'
import { buildFileTree } from './fileTree'
import type { PRFile } from '../types'

const given_file = (filename: string): PRFile => ({
  sha: 'abc',
  filename,
  status: 'modified',
  additions: 1,
  deletions: 1,
  changes: 2,
  blob_url: `https://github.com/o/r/blob/abc/${filename}`,
})

describe('buildFileTree', () => {
  it('given flat files at the root, then returns one file node per file, sorted', () => {
    const tree = buildFileTree([given_file('b.ts'), given_file('a.ts')])
    expect(tree).toEqual([
      { kind: 'file', name: 'a.ts', file: given_file('a.ts') },
      { kind: 'file', name: 'b.ts', file: given_file('b.ts') },
    ])
  })

  it('given nested files, then builds a dir node per directory level', () => {
    const tree = buildFileTree([given_file('src/foo.ts'), given_file('src/bar.ts')])
    expect(tree).toHaveLength(1)
    expect(tree[0]).toMatchObject({ kind: 'dir', name: 'src', path: 'src' })
    if (tree[0].kind !== 'dir') throw new Error('expected dir')
    expect(tree[0].children.map((c) => c.name)).toEqual(['bar.ts', 'foo.ts'])
  })

  it('given a chain of directories with a single child each, then collapses them into one dir node', () => {
    const tree = buildFileTree([given_file('src/features/pr-review/lib/fileTree.ts')])
    expect(tree).toHaveLength(1)
    const node = tree[0]
    if (node.kind !== 'dir') throw new Error('expected dir')
    expect(node.name).toBe('src/features/pr-review/lib')
    expect(node.path).toBe('src/features/pr-review/lib')
    expect(node.children).toEqual([
      { kind: 'file', name: 'fileTree.ts', file: given_file('src/features/pr-review/lib/fileTree.ts') },
    ])
  })

  it('given a directory with a file and a subdirectory, then does not collapse it', () => {
    const tree = buildFileTree([given_file('src/index.ts'), given_file('src/lib/util.ts')])
    expect(tree).toHaveLength(1)
    const node = tree[0]
    if (node.kind !== 'dir') throw new Error('expected dir')
    expect(node.name).toBe('src')
    expect(node.children.map((c) => c.name)).toEqual(['lib', 'index.ts'])
  })

  it('given mixed dirs and files at the same level, then sorts dirs before files, each alphabetically', () => {
    const tree = buildFileTree([
      given_file('zeta.ts'),
      given_file('alpha/one.ts'),
      given_file('beta/two.ts'),
      given_file('alpha.ts'),
    ])
    expect(tree.map((n) => n.name)).toEqual(['alpha', 'beta', 'alpha.ts', 'zeta.ts'])
  })
})
