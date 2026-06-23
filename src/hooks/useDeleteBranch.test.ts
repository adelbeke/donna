import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { useDeleteBranch } from './useDeleteBranch'
import { useAuthStore } from '../store/authStore'

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return { wrapper: ({ children }: { children: React.ReactNode }) => React.createElement(QueryClientProvider, { client: qc }, children), qc }
}

beforeEach(() => {
  vi.mocked(useAuthStore).mockImplementation((selector) =>
    selector({ token: 'tok', user: { login: 'alice' } } as never)
  )
  mockFetch.mockReset()
})

describe('useDeleteBranch', () => {
  it('GIVEN valid token WHEN deleting THEN calls correct GitHub endpoint', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useDeleteBranch(), { wrapper })
    await act(async () => { result.current.mutate({ repo: 'org/myrepo', name: 'feat-x' }) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/org/myrepo/git/refs/heads/feat-x',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      })
    )
  })

  it('GIVEN branches in cache WHEN deleting THEN optimistically removes the matching branch', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })
    const { wrapper, qc } = makeWrapper()
    qc.setQueryData(['branches', 'org/repo'], [
      { name: 'feat-x', repo: 'org/repo' },
      { name: 'feat-y', repo: 'org/repo' },
    ])

    const { result } = renderHook(() => useDeleteBranch(), { wrapper })
    act(() => { result.current.mutate({ repo: 'org/repo', name: 'feat-x' }) })

    await waitFor(() => {
      const cached = qc.getQueryData<{ name: string }[]>(['branches', 'org/repo'])
      return cached?.every((b) => b.name !== 'feat-x')
    })
  })

  it('GIVEN API returns non-ok WHEN deleting THEN mutation errors', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 422 })
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useDeleteBranch(), { wrapper })
    await act(async () => { result.current.mutate({ repo: 'org/repo', name: 'feat-x' }) })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(Error)
    expect((result.current.error as Error).message).toContain('422')
  })
})
