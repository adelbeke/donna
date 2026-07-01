import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SettingsModal } from './SettingsModal'
import { usePRStore } from '../../stores/prStore'
import { usePullRequests } from '../../queries/useGitHubPRs'

vi.mock('../../queries/useGitHubPRs', () => ({
  usePullRequests: vi.fn(),
}))

const mockUsePullRequests = vi.mocked(usePullRequests)

describe('SettingsModal', () => {
  it('GIVEN authored section with a single repo WHEN rendered THEN renders nothing', () => {
    usePRStore.setState({ section: 'authored' })
    mockUsePullRequests.mockReturnValue({ repos: ['org/repo'] } as never)

    const { container } = render(<SettingsModal />)

    expect(container).toBeEmptyDOMElement()
  })

  it('GIVEN authored section with multiple repos WHEN rendered THEN shows the settings button', () => {
    usePRStore.setState({ section: 'authored' })
    mockUsePullRequests.mockReturnValue({ repos: ['org/repo', 'org/other'] } as never)

    render(<SettingsModal />)

    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('GIVEN review-requested section with a single repo WHEN rendered THEN still shows the settings button', () => {
    usePRStore.setState({ section: 'review-requested' })
    mockUsePullRequests.mockReturnValue({ repos: ['org/repo'] } as never)

    render(<SettingsModal />)

    expect(screen.getByText('Settings')).toBeInTheDocument()
  })
})
