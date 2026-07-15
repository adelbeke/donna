import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import { ChangelogButton } from './ChangelogButton'
import { useChangelogStore } from '@/features/updates/stores/changelogStore.ts'

const renderWithClient = (ui: ReactNode) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  useChangelogStore.setState({ lastSeenVersion: null })
})

afterEach(() => {
  delete window.electronAPI
})

describe('ChangelogButton', () => {
  it('shows the unread pill when there is a newer version than last seen', async () => {
    const rest = vi.fn().mockImplementation((path: string) => {
      if (path.includes('latest')) return Promise.resolve({ tag_name: 'v1.1.0' })
      return Promise.resolve([])
    })
    window.electronAPI = { gh: { rest } } as unknown as typeof window.electronAPI
    useChangelogStore.setState({ lastSeenVersion: 'v1.0.0' })

    renderWithClient(<ChangelogButton />)

    await waitFor(() => expect(screen.getByText('New')).toBeInTheDocument())
  })

  it('opens the modal and marks the version seen on click, clearing the pill', async () => {
    const rest = vi.fn().mockImplementation((path: string) => {
      if (path.includes('latest')) return Promise.resolve({ tag_name: 'v1.1.0' })
      return Promise.resolve([
        {
          tag_name: 'v1.1.0',
          name: 'v1.1.0',
          body: '### Features\n- add thing',
          published_at: '2024-01-01T00:00:00Z',
        },
      ])
    })
    window.electronAPI = { gh: { rest } } as unknown as typeof window.electronAPI
    useChangelogStore.setState({ lastSeenVersion: 'v1.0.0' })

    renderWithClient(<ChangelogButton />)
    await waitFor(() => expect(screen.getByText('New')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: /what's new/i }))

    expect(useChangelogStore.getState().lastSeenVersion).toBe('v1.1.0')
    await waitFor(() => expect(screen.getByText('add thing')).toBeInTheDocument())
    expect(screen.queryByText('New')).not.toBeInTheDocument()
  })

  it('tags the release matching the running app version as Current', async () => {
    const rest = vi.fn().mockImplementation((path: string) => {
      if (path.includes('latest')) return Promise.resolve({ tag_name: `v${__APP_VERSION__}` })
      return Promise.resolve([
        {
          tag_name: `v${__APP_VERSION__}`,
          name: `v${__APP_VERSION__}`,
          body: '### Features\n- current release',
          published_at: '2024-01-01T00:00:00Z',
        },
        {
          tag_name: 'v0.0.1',
          name: 'v0.0.1',
          body: '### Features\n- ancient release',
          published_at: '2023-01-01T00:00:00Z',
        },
      ])
    })
    window.electronAPI = { gh: { rest } } as unknown as typeof window.electronAPI

    renderWithClient(<ChangelogButton />)
    await userEvent.click(screen.getByRole('button', { name: /what's new/i }))

    await waitFor(() => expect(screen.getByText('current release')).toBeInTheDocument())
    expect(screen.getByText('Current')).toBeInTheDocument()
  })
})
