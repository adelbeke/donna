import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { useRecentRepos } from './useRecentRepos'
import { useAuthStore } from '../store/authStore'

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

function makeEvents(repoNames: string[]) {
  return repoNames.map((name) => ({ repo: { name } }))
}

beforeEach(() => {
  vi.mocked(useAuthStore).mockImplementation((selector) =>
    selector({ token: 'tok', user: { login: 'alice' } } as never)
  )
  vi.stubGlobal('fetch', vi.fn())
})

describe('useRecentRepos', () => {
  it('GIVEN events with duplicate repos WHEN fetching THEN deduplicates', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makeEvents(['org/repo-a', 'org/repo-b', 'org/repo-a'])), {
        status: 200,
      })
    )

    const { result } = renderHook(() => useRecentRepos(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data!.map((r) => r.full_name)).toEqual(['org/repo-a', 'org/repo-b'])
  })

  it('GIVEN more than 10 distinct repos in events WHEN fetching THEN caps at 10', async () => {
    const repoNames = Array.from({ length: 15 }, (_, i) => `org/repo-${i}`)
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makeEvents(repoNames)), { status: 200 })
    )

    const { result } = renderHook(() => useRecentRepos(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(10)
  })

  it('GIVEN non-ok response WHEN fetching THEN returns empty array', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 401 }))

    const { result } = renderHook(() => useRecentRepos(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('GIVEN no token WHEN rendering THEN query is idle', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ token: null, user: null } as never)
    )

    const { result } = renderHook(() => useRecentRepos(), { wrapper: makeWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetch).not.toHaveBeenCalled()
  })
})
