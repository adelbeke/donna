import { describe, it, expect } from 'vitest'
import { mapBranchNodes } from './useBranches'

const makeNode = (
  name: string,
  login: string | null,
  date: string,
  pr?: { number: number; state: string }
) => ({
  name,
  target: {
    committedDate: date,
    author: { user: login ? { login } : null },
  },
  associatedPullRequests: { nodes: pr ? [pr] : [] },
})

describe('mapBranchNodes', () => {
  it('filters default branches and non-matching authors', () => {
    const nodes = [
      makeNode('main', 'alice', '2024-01-01T00:00:00Z'),
      makeNode('feature-x', 'bob', '2024-01-02T00:00:00Z'),
      makeNode('feature-y', 'alice', '2024-01-03T00:00:00Z', { number: 42, state: 'OPEN' }),
    ]

    const result = mapBranchNodes(nodes, 'org/repo', 'alice')

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: 'feature-y',
      repo: 'org/repo',
      lastCommitDate: '2024-01-03T00:00:00Z',
      linkedPr: { number: 42, state: 'OPEN' },
    })
  })

  it('includes all non-default branches when login is undefined', () => {
    const nodes = [
      makeNode('master', 'alice', '2024-01-01T00:00:00Z'),
      makeNode('feat-a', 'alice', '2024-01-02T00:00:00Z'),
      makeNode('feat-b', 'bob', '2024-01-03T00:00:00Z'),
    ]

    const result = mapBranchNodes(nodes, 'org/repo', undefined)
    expect(result.map((b) => b.name)).toEqual(['feat-a', 'feat-b'])
  })

  it('skips nodes with null target', () => {
    const nodes = [
      { name: 'annotated-tag-branch', target: null, associatedPullRequests: { nodes: [] } },
      makeNode('valid', 'alice', '2024-01-01T00:00:00Z'),
    ]

    const result = mapBranchNodes(nodes, 'org/repo', 'alice')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('valid')
  })
})
