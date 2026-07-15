import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { UpdateBanner } from './UpdateBanner'

afterEach(() => {
  delete window.electronAPI
})

describe('UpdateBanner', () => {
  it('renders nothing while no update has been downloaded', async () => {
    window.electronAPI = {
      updater: {
        isUpdateDownloaded: vi.fn().mockResolvedValue(false),
        onUpdateDownloaded: vi.fn(),
        installUpdate: vi.fn(),
      },
    } as unknown as typeof window.electronAPI

    const { container } = render(<UpdateBanner version="v1.2.3" />)

    await waitFor(() => expect(window.electronAPI!.updater.isUpdateDownloaded).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the banner once an update was already downloaded before mount', async () => {
    window.electronAPI = {
      updater: {
        isUpdateDownloaded: vi.fn().mockResolvedValue(true),
        onUpdateDownloaded: vi.fn(),
        installUpdate: vi.fn(),
      },
    } as unknown as typeof window.electronAPI

    render(<UpdateBanner version="v1.2.3" />)

    await waitFor(() =>
      expect(screen.getByText('Version v1.2.3 is available.')).toBeInTheDocument()
    )
  })

  it('shows the banner when the update-downloaded event fires after mount', async () => {
    let onDownloaded = () => {}
    window.electronAPI = {
      updater: {
        isUpdateDownloaded: vi.fn().mockResolvedValue(false),
        onUpdateDownloaded: vi.fn((cb: () => void) => {
          onDownloaded = cb
        }),
        installUpdate: vi.fn(),
      },
    } as unknown as typeof window.electronAPI

    render(<UpdateBanner version="v1.2.3" />)
    expect(screen.queryByText(/is available/)).not.toBeInTheDocument()

    act(() => onDownloaded())

    await waitFor(() =>
      expect(screen.getByText('Version v1.2.3 is available.')).toBeInTheDocument()
    )
  })

  it('dismisses the banner when ✕ is clicked', async () => {
    window.electronAPI = {
      updater: {
        isUpdateDownloaded: vi.fn().mockResolvedValue(true),
        onUpdateDownloaded: vi.fn(),
        installUpdate: vi.fn(),
      },
    } as unknown as typeof window.electronAPI

    render(<UpdateBanner version="v1.2.3" />)
    await waitFor(() =>
      expect(screen.getByText('Version v1.2.3 is available.')).toBeInTheDocument()
    )

    await userEvent.click(screen.getByText('✕'))

    expect(screen.queryByText(/is available/)).not.toBeInTheDocument()
  })

  it('installs the update when "Restart to install" is clicked', async () => {
    const installUpdate = vi.fn()
    window.electronAPI = {
      updater: {
        isUpdateDownloaded: vi.fn().mockResolvedValue(true),
        onUpdateDownloaded: vi.fn(),
        installUpdate,
      },
    } as unknown as typeof window.electronAPI

    render(<UpdateBanner version="v1.2.3" />)
    await waitFor(() => expect(screen.getByText('Restart to install')).toBeInTheDocument())

    await userEvent.click(screen.getByText('Restart to install'))

    expect(installUpdate).toHaveBeenCalled()
  })
})
