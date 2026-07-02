import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('GIVEN repos from multiple orgs WHEN clicking an org chip THEN selects all repos of that org', () => {
    usePRStore.setState({ section: 'review-requested' })
    mockUsePullRequests.mockReturnValue({
      repos: ['acme/repo-a', 'acme/repo-b', 'other/repo-c'],
    } as never)

    render(<SettingsModal />)
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.click(screen.getByText('acme'))

    expect(usePRStore.getState().viewFilters['review-requested'].repos).toEqual([
      'acme/repo-a',
      'acme/repo-b',
    ])
  })

  it('GIVEN an org fully selected WHEN clicking its chip again THEN deselects all repos of that org', () => {
    usePRStore.setState({ section: 'review-requested' })
    usePRStore.getState().setViewFilters('review-requested', {
      repos: ['acme/repo-a', 'acme/repo-b'],
    })
    mockUsePullRequests.mockReturnValue({
      repos: ['acme/repo-a', 'acme/repo-b', 'other/repo-c'],
    } as never)

    render(<SettingsModal />)
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.click(screen.getByText('acme'))

    expect(usePRStore.getState().viewFilters['review-requested'].repos).toEqual([])
  })

  it('GIVEN an org selected via chip WHEN unchecking one of its repos THEN keeps the rest of the org selected', () => {
    usePRStore.setState({ section: 'review-requested' })
    mockUsePullRequests.mockReturnValue({
      repos: ['acme/repo-a', 'acme/repo-b', 'other/repo-c'],
    } as never)

    render(<SettingsModal />)
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.click(screen.getByText('acme'))
    fireEvent.click(screen.getByText('repo-a'))

    expect(usePRStore.getState().viewFilters['review-requested'].repos).toEqual(['acme/repo-b'])
  })

  it('GIVEN repos from a single org WHEN rendered THEN does not show an organization filter', () => {
    usePRStore.setState({ section: 'review-requested' })
    mockUsePullRequests.mockReturnValue({ repos: ['acme/repo-a', 'acme/repo-b'] } as never)

    render(<SettingsModal />)
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))

    expect(screen.queryByText('Organization')).not.toBeInTheDocument()
  })
})
