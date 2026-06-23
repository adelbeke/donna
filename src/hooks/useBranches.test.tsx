import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { useBranches, mapBranchNodes } from './useBranches'
import { createGitHubClient } from '../lib/github'
import { useAuthStore } from '../store/authStore'

vi.mock('../lib/github', () => ({
  createGitHubClient: vi.fn(),
  BRANCHES_QUERY: 'BRANCHES_QUERY',
}))

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

const mockRequest = vi.fn()

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

function makeNode(
  name: string,
  login: string | null,
  date: string,
  pr?: { number: number; state: string; url: string }
) {
  return {
    name,
    target: { committedDate: date, author: { user: login ? { login } : null } },
    associatedPullRequests: { nodes: pr ? [pr] : [] },
  }
}

function makePage(nodes: ReturnType<typeof makeNode>[], hasNextPage: boolean, endCursor = '') {
  return { repository: { refs: { pageInfo: { hasNextPage, endCursor }, nodes } } }
}

beforeEach(() => {
  vi.mocked(createGitHubClient).mockReturnValue({ request: mockRequest } as unknown as ReturnType<typeof createGitHubClient>)
  vi.mocked(useAuthStore).mockImplementation((selector) =>
    selector({ token: 'tok', user: { login: 'alice' } } as never)
  )
  mockRequest.mockReset()
})

describe('useBranches', () => {
  it('GIVEN single page WHEN fetching THEN returns mapped branches', async () => {
    mockRequest.mockResolvedValueOnce(makePage([makeNode('feat-x', 'alice', '2024-01-01T00:00:00Z')], false))

    const { result } = renderHook(() => useBranches(['org/repo']), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].name).toBe('feat-x')
    expect(mockRequest).toHaveBeenCalledTimes(1)
  })

  it('GIVEN two pages WHEN fetching THEN paginates with cursor and accumulates nodes', async () => {
    mockRequest
      .mockResolvedValueOnce(makePage([makeNode('feat-a', 'alice', '2024-01-02T00:00:00Z')], true, 'cursor1'))
      .mockResolvedValueOnce(makePage([makeNode('feat-b', 'alice', '2024-01-01T00:00:00Z')], false))

    const { result } = renderHook(() => useBranches(['org/repo']), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockRequest).toHaveBeenCalledTimes(2)
    expect(mockRequest).toHaveBeenNthCalledWith(2, expect.anything(), expect.objectContaining({ cursor: 'cursor1' }))
    expect(result.current.data!.map((b) => b.name)).toEqual(['feat-a', 'feat-b'])
  })

  it('GIVEN always hasNextPage WHEN fetching THEN caps at 10 pages and warns', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockRequest.mockResolvedValue(makePage([makeNode('feat-x', 'alice', '2024-01-01T00:00:00Z')], true, 'cursor'))

    const { result } = renderHook(() => useBranches(['org/repo']), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockRequest).toHaveBeenCalledTimes(10)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('pagination cap'))
    warnSpy.mockRestore()
  })

  it('GIVEN branches from two repos WHEN fetching THEN sorts by date descending', async () => {
    mockRequest
      .mockResolvedValueOnce(makePage([makeNode('feat-old', 'alice', '2024-01-01T00:00:00Z')], false))
      .mockResolvedValueOnce(makePage([makeNode('feat-new', 'alice', '2024-06-01T00:00:00Z')], false))

    const { result } = renderHook(() => useBranches(['org/repo1', 'org/repo2']), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data!.map((b) => b.name)).toEqual(['feat-new', 'feat-old'])
  })

  it('GIVEN no token WHEN rendering THEN query is idle', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ token: null, user: null } as never)
    )

    const { result } = renderHook(() => useBranches(['org/repo']), { wrapper: makeWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockRequest).not.toHaveBeenCalled()
  })
})

describe('mapBranchNodes', () => {
  it('GIVEN default branch and non-matching author WHEN mapping THEN filters both', () => {
    const nodes = [
      makeNode('main', 'alice', '2024-01-01T00:00:00Z'),
      makeNode('feature-x', 'bob', '2024-01-02T00:00:00Z'),
      makeNode('feature-y', 'alice', '2024-01-03T00:00:00Z', { number: 42, state: 'OPEN', url: 'https://github.com/org/repo/pull/42' }),
    ]

    const actual = mapBranchNodes(nodes, 'org/repo', 'alice')

    expect(actual).toHaveLength(1)
    expect(actual[0]).toEqual({
      name: 'feature-y',
      repo: 'org/repo',
      lastCommitDate: '2024-01-03T00:00:00Z',
      linkedPr: { number: 42, state: 'OPEN', url: 'https://github.com/org/repo/pull/42' },
    })
  })

  it('GIVEN undefined login WHEN mapping THEN includes all non-default branches', () => {
    const nodes = [
      makeNode('master', 'alice', '2024-01-01T00:00:00Z'),
      makeNode('feat-a', 'alice', '2024-01-02T00:00:00Z'),
      makeNode('feat-b', 'bob', '2024-01-03T00:00:00Z'),
    ]

    const actual = mapBranchNodes(nodes, 'org/repo', undefined)
    expect(actual.map((b) => b.name)).toEqual(['feat-a', 'feat-b'])
  })

  it('GIVEN node with null target WHEN mapping THEN skips it', () => {
    const nodes = [
      { name: 'annotated-tag-branch', target: null, associatedPullRequests: { nodes: [] } },
      makeNode('valid', 'alice', '2024-01-01T00:00:00Z'),
    ]

    const actual = mapBranchNodes(nodes, 'org/repo', 'alice')
    expect(actual).toHaveLength(1)
    expect(actual[0].name).toBe('valid')
  })
})
