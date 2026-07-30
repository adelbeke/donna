import { describe, it, expect, vi, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { usePRFiles } from './usePRFiles'
import { useAuthStore } from '@/features/auth/stores/authStore'
import type { PRFile } from '../types'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const makeFile = (filename: string): PRFile => ({
  sha: 'abc',
  filename,
  status: 'modified',
  additions: 1,
  deletions: 1,
  changes: 2,
  patch: '@@ -1,1 +1,1 @@\n-a\n+b',
  blob_url: `https://github.com/o/r/blob/abc/${filename}`,
})

describe('usePRFiles', () => {
  afterEach(() => {
    delete window.electronAPI
    useAuthStore.setState({ token: null, user: null })
  })

  const setupAuth = () => useAuthStore.setState({ token: 'gh-cli', user: null })

  it('given a short page, when fetched, then stops after one call', async () => {
    setupAuth()
    const rest = vi.fn().mockResolvedValue([makeFile('a.ts')])
    window.electronAPI = { gh: { rest } } as unknown as typeof window.electronAPI

    const { result } = renderHook(() => usePRFiles({ owner: 'o', repo: 'r', number: 1 }), {
      wrapper,
    })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toEqual({ files: [makeFile('a.ts')], truncated: false })
    expect(rest).toHaveBeenCalledTimes(1)
  })

  it('given a full first page, when fetched, then fetches page 2', async () => {
    setupAuth()
    const fullPage = Array.from({ length: 100 }, (_, i) => makeFile(`f${i}.ts`))
    const rest = vi
      .fn()
      .mockResolvedValueOnce(fullPage)
      .mockResolvedValueOnce([makeFile('last.ts')])
    window.electronAPI = { gh: { rest } } as unknown as typeof window.electronAPI

    const { result } = renderHook(() => usePRFiles({ owner: 'o', repo: 'r', number: 1 }), {
      wrapper,
    })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.files).toHaveLength(101)
    expect(result.current.data?.truncated).toBe(false)
    expect(rest).toHaveBeenCalledTimes(2)
  })

  it('given more full pages than the cap, when fetched, then marks truncated', async () => {
    setupAuth()
    const fullPage = Array.from({ length: 100 }, (_, i) => makeFile(`f${i}.ts`))
    const rest = vi.fn().mockResolvedValue(fullPage)
    window.electronAPI = { gh: { rest } } as unknown as typeof window.electronAPI

    const { result } = renderHook(() => usePRFiles({ owner: 'o', repo: 'r', number: 1 }), {
      wrapper,
    })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.truncated).toBe(true)
    expect(rest).toHaveBeenCalledTimes(5)
  })
})
