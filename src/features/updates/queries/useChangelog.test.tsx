import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import { useChangelog } from './useChangelog'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

afterEach(() => {
  delete window.electronAPI
})

describe('useChangelog', () => {
  it('does not fetch when disabled', () => {
    const rest = vi.fn()
    window.electronAPI = { gh: { rest } } as unknown as typeof window.electronAPI
    renderHook(() => useChangelog(false), { wrapper })
    expect(rest).not.toHaveBeenCalled()
  })

  it('fetches and caps releases to 10 when enabled', async () => {
    const releases = Array.from({ length: 15 }, (_, i) => ({
      tag_name: `v0.${i}.0`,
      name: `v0.${i}.0`,
      body: '',
      published_at: '2024-01-01T00:00:00Z',
    }))
    const rest = vi.fn().mockResolvedValue(releases)
    window.electronAPI = { gh: { rest } } as unknown as typeof window.electronAPI

    const { result } = renderHook(() => useChangelog(true), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(rest).toHaveBeenCalledWith('repos/adelbeke/donna/releases')
    expect(result.current.data).toHaveLength(10)
  })
})
