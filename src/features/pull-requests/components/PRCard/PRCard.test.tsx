import type { ReactElement } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import userEvent from '@testing-library/user-event'
import { PRCard } from './PRCard'
import { usePRStore } from '../../stores/prStore'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { useBranchStore } from '@/features/branches/stores/branchStore'
import { usePRDetails } from '../../queries/usePRDetails'
import { useCheckContexts } from '../../queries/useCheckContexts'
import type { PullRequest, ReviewState } from '@/types/github'

const mockUsePRDetails = vi.mocked(usePRDetails)
const mockUseCheckContexts = vi.mocked(useCheckContexts)

const renderCard = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

vi.mock('../../queries/useCheckContexts', () => ({
  useCheckContexts: vi.fn(() => ({ checks: [], isLoading: false, refetch: vi.fn() })),
}))
vi.mock('../../queries/usePRDetails', () => ({
  usePRDetails: vi.fn(() => ({ data: undefined })),
}))

const pr: PullRequest = {
  id: 'pr-42',
  number: 42,
  title: 'Fix the thing',
  url: 'https://github.com/org/repo/pull/42',
  isDraft: false,
  headRefName: 'fix-the-thing',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-02-20T12:00:00Z',
  author: { login: 'alice', avatarUrl: 'https://example.com/alice.png' },
  repository: { name: 'repo', nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
  reviewRequests: { nodes: [] },
  reviews: { nodes: [] },
  additions: 100,
  deletions: 50,
  mergeable: 'MERGEABLE',
  commits: { nodes: [] },
  isHidden: false,
}

beforeEach(() => {
  usePRStore.setState({ priorityIds: [], hiddenIds: [], openPRsInDonna: true })
  useAuthStore.setState({ user: { login: 'viewer', avatarUrl: '', name: 'Viewer' }, token: 'test' })
  useBranchStore.setState({ localPaths: [] })
  mockUsePRDetails.mockReturnValue({ data: undefined } as never)
  mockUseCheckContexts.mockReturnValue({ checks: [], isLoading: false, refetch: vi.fn() } as never)
})

describe('PRCard', () => {
  it('GIVEN author is null WHEN rendered THEN does not crash', () => {
    const prNoAuthor: PullRequest = { ...pr, author: null }
    renderCard(<PRCard pr={prNoAuthor} />)
    expect(screen.getByText('Fix the thing')).toBeInTheDocument()
  })

  it('renders opened timestamp', () => {
    renderCard(<PRCard pr={pr} />)
    expect(screen.getByText(/opened/)).toBeInTheDocument()
  })

  it('renders updated timestamp', () => {
    renderCard(<PRCard pr={pr} />)
    expect(screen.getByText(/updated/)).toBeInTheDocument()
  })

  it('renders PR title', () => {
    renderCard(<PRCard pr={pr} />)
    expect(screen.getByText('Fix the thing')).toBeInTheDocument()
  })

  it('renders repo name', () => {
    renderCard(<PRCard pr={pr} />)
    expect(screen.getByText('org/repo')).toBeInTheDocument()
  })

  it('star button click toggles priority in store', async () => {
    const user = userEvent.setup()
    renderCard(<PRCard pr={pr} />)
    const starBtn = screen.getByRole('button', { name: 'Mark as top priority' })
    await user.click(starBtn)
    expect(usePRStore.getState().priorityIds).toContain('pr-42')
  })

  it('star button click again removes priority', async () => {
    const user = userEvent.setup()
    usePRStore.setState({ priorityIds: ['pr-42'] })
    renderCard(<PRCard pr={pr} />)
    const starBtn = screen.getByRole('button', { name: 'Remove priority' })
    await user.click(starBtn)
    expect(usePRStore.getState().priorityIds).not.toContain('pr-42')
  })

  it('GIVEN showHideAndStar=false WHEN rendered THEN hide and star buttons are not shown', () => {
    renderCard(<PRCard pr={pr} showHideAndStar={false} />)
    expect(screen.queryByRole('button', { name: 'Hide PR (Donna only)' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark as top priority' })).not.toBeInTheDocument()
  })

  it('copy checkout command button click copies gh pr checkout command to clipboard', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const user = userEvent.setup()
    renderCard(<PRCard pr={pr} />)
    await user.click(screen.getByRole('button', { name: 'Copy checkout command' }))
    expect(writeText).toHaveBeenCalledWith(`gh pr checkout ${pr.number}`)
    writeText.mockRestore()
  })

  describe('clicking the card', () => {
    it('GIVEN card body clicked THEN navigates to the diff view', async () => {
      const user = userEvent.setup()
      render(
        <MemoryRouter initialEntries={['/prs']}>
          <Routes>
            <Route path="/prs" element={<PRCard pr={pr} />} />
            <Route path="/prs/:owner/:repo/:number" element={<div>diff view</div>} />
          </Routes>
        </MemoryRouter>
      )
      await user.click(screen.getByText('org/repo'))
      expect(screen.getByText('diff view')).toBeInTheDocument()
    })

    it('GIVEN openPRsInDonna is false WHEN card body clicked THEN opens the PR in a new tab', async () => {
      usePRStore.setState({ openPRsInDonna: false })
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      const user = userEvent.setup()
      renderCard(<PRCard pr={pr} />)
      await user.click(screen.getByText('org/repo'))
      expect(openSpy).toHaveBeenCalledWith(pr.url, '_blank', 'noopener,noreferrer')
      openSpy.mockRestore()
    })

    it('GIVEN "Open on GitHub" action clicked THEN opens the PR in a new tab regardless of the setting', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      const user = userEvent.setup()
      renderCard(<PRCard pr={pr} />)
      await user.click(screen.getByRole('button', { name: 'Open on GitHub' }))
      expect(openSpy).toHaveBeenCalledWith(pr.url, '_blank', 'noopener,noreferrer')
      openSpy.mockRestore()
    })

    it('GIVEN openPRsInDonna is false THEN a "Review in Donna" action is shown and navigates', async () => {
      usePRStore.setState({ openPRsInDonna: false })
      const user = userEvent.setup()
      render(
        <MemoryRouter initialEntries={['/prs']}>
          <Routes>
            <Route path="/prs" element={<PRCard pr={pr} />} />
            <Route path="/prs/:owner/:repo/:number" element={<div>diff view</div>} />
          </Routes>
        </MemoryRouter>
      )
      await user.click(screen.getByRole('button', { name: 'Review in Donna' }))
      expect(screen.getByText('diff view')).toBeInTheDocument()
    })

    it('GIVEN copy checkout command button clicked THEN does not also open the PR', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
      const user = userEvent.setup()
      renderCard(<PRCard pr={pr} />)
      await user.click(screen.getByRole('button', { name: 'Copy checkout command' }))
      expect(openSpy).not.toHaveBeenCalled()
      openSpy.mockRestore()
      writeText.mockRestore()
    })

    it('GIVEN star button clicked THEN does not also open the PR', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      const user = userEvent.setup()
      renderCard(<PRCard pr={pr} />)
      await user.click(screen.getByRole('button', { name: 'Mark as top priority' }))
      expect(openSpy).not.toHaveBeenCalled()
      openSpy.mockRestore()
    })
  })

  describe('PRChecksModal rollup state footer', () => {
    const greenCheck = {
      __typename: 'CheckRun' as const,
      name: 'CI',
      status: 'COMPLETED' as const,
      conclusion: 'SUCCESS' as const,
      detailsUrl: null,
    }

    const makePrWithRollup = (state: 'PENDING' | 'EXPECTED' | 'SUCCESS') => {
      return {
        ...pr,
        commits: {
          nodes: [
            {
              commit: {
                statusCheckRollup: {
                  state,
                  contexts: { nodes: [greenCheck] },
                },
              },
            },
          ],
        },
      }
    }

    it('GIVEN rollup EXPECTED with all-green contexts WHEN checks opened THEN footer note appears', async () => {
      const user = userEvent.setup()
      renderCard(<PRCard pr={makePrWithRollup('EXPECTED')} />)
      await user.click(screen.getByText('Checks pending'))
      expect(
        screen.getByText('Some checks may still be pending or not yet shown')
      ).toBeInTheDocument()
    })

    it('GIVEN rollup PENDING with all-green contexts WHEN checks opened THEN footer note appears', async () => {
      const user = userEvent.setup()
      renderCard(<PRCard pr={makePrWithRollup('PENDING')} />)
      await user.click(screen.getByText('Checks pending'))
      expect(
        screen.getByText('Some checks may still be pending or not yet shown')
      ).toBeInTheDocument()
    })

    it('GIVEN rollup SUCCESS WHEN checks opened THEN no footer note', async () => {
      const user = userEvent.setup()
      renderCard(<PRCard pr={makePrWithRollup('SUCCESS')} />)
      await user.click(screen.getByText('Checks pass'))
      expect(
        screen.queryByText('Some checks may still be pending or not yet shown')
      ).not.toBeInTheDocument()
    })

    it('GIVEN checks modal open WHEN reload button clicked THEN refetch is called', async () => {
      const refetch = vi.fn()
      mockUseCheckContexts.mockReturnValue({ checks: [], isLoading: false, refetch } as never)
      const user = userEvent.setup()
      renderCard(<PRCard pr={makePrWithRollup('SUCCESS')} />)
      await user.click(screen.getByText('Checks pass'))
      await user.click(screen.getByTitle('Reload checks'))
      expect(refetch).toHaveBeenCalled()
    })
  })

  describe('review state badge', () => {
    const makeDetailsWithReview = (state: ReviewState) => ({
      data: {
        id: pr.id,
        reviews: {
          nodes: [
            {
              state,
              submittedAt: '2024-01-01T10:00:00Z',
              author: { login: 'viewer', avatarUrl: '' },
            },
          ],
        },
        reviewRequests: { nodes: [] },
        mergeable: 'MERGEABLE' as const,
        commits: { nodes: [] },
      },
    })

    it('GIVEN details returns APPROVED review WHEN rendered THEN shows Approved badge', () => {
      mockUsePRDetails.mockReturnValue(makeDetailsWithReview('APPROVED') as never)
      renderCard(<PRCard pr={pr} />)
      expect(screen.getByText('Approved')).toBeInTheDocument()
    })

    it('GIVEN details returns CHANGES_REQUESTED review WHEN rendered THEN shows Changes requested badge', () => {
      mockUsePRDetails.mockReturnValue(makeDetailsWithReview('CHANGES_REQUESTED') as never)
      renderCard(<PRCard pr={pr} />)
      expect(screen.getByText('Changes requested')).toBeInTheDocument()
    })

    it('GIVEN details returns COMMENTED review WHEN rendered THEN shows Commented badge', () => {
      mockUsePRDetails.mockReturnValue(makeDetailsWithReview('COMMENTED') as never)
      renderCard(<PRCard pr={pr} />)
      expect(screen.getByText('Commented')).toBeInTheDocument()
    })

    it('GIVEN details returns no matching review WHEN rendered THEN no review badge', () => {
      renderCard(<PRCard pr={pr} />)
      expect(screen.queryByText('Approved')).not.toBeInTheDocument()
      expect(screen.queryByText('Changes requested')).not.toBeInTheDocument()
    })

    it('GIVEN isAuthored=true WHEN rendered THEN no review badge shown', () => {
      mockUsePRDetails.mockReturnValue(makeDetailsWithReview('APPROVED') as never)
      renderCard(<PRCard pr={pr} isAuthored />)
      expect(screen.queryByText('Approved')).not.toBeInTheDocument()
    })
  })

  describe('CI checks badge', () => {
    const prWithCheckState = (state: 'SUCCESS' | 'FAILURE' | 'PENDING') => {
      return {
        ...pr,
        commits: {
          nodes: [
            {
              commit: {
                statusCheckRollup: { state, contexts: { nodes: [] } },
              },
            },
          ],
        },
      }
    }

    it('GIVEN SUCCESS rollup WHEN rendered THEN shows Checks pass badge', () => {
      renderCard(<PRCard pr={prWithCheckState('SUCCESS')} />)
      expect(screen.getByText('Checks pass')).toBeInTheDocument()
    })

    it('GIVEN FAILURE rollup WHEN rendered THEN shows Checks failed badge', () => {
      renderCard(<PRCard pr={prWithCheckState('FAILURE')} />)
      expect(screen.getByText('Checks failed')).toBeInTheDocument()
    })

    it('GIVEN PENDING rollup WHEN rendered THEN shows Checks pending badge', () => {
      renderCard(<PRCard pr={prWithCheckState('PENDING')} />)
      expect(screen.getByText('Checks pending')).toBeInTheDocument()
    })

    it('GIVEN no commits WHEN rendered THEN no CI badge', () => {
      renderCard(<PRCard pr={{ ...pr, commits: { nodes: [] } }} />)
      expect(screen.queryByText('Checks pass')).not.toBeInTheDocument()
      expect(screen.queryByText('Checks failed')).not.toBeInTheDocument()
    })
  })

  describe('conflict badge', () => {
    it('GIVEN mergeable CONFLICTING WHEN rendered THEN shows Conflict badge', () => {
      renderCard(<PRCard pr={{ ...pr, mergeable: 'CONFLICTING' }} />)
      expect(screen.getByText('Conflict')).toBeInTheDocument()
    })

    it('GIVEN mergeable MERGEABLE WHEN rendered THEN no Conflict badge', () => {
      renderCard(<PRCard pr={{ ...pr, mergeable: 'MERGEABLE' }} />)
      expect(screen.queryByText('Conflict')).not.toBeInTheDocument()
    })
  })

  describe('run shortcut action', () => {
    it('GIVEN isAuthored=false THEN run shortcut action is not shown, regardless of local repos', () => {
      useBranchStore.setState({ localPaths: ['/Users/me/code/repo'] })
      renderCard(<PRCard pr={pr} isAuthored={false} />)
      expect(screen.queryByRole('button', { name: /run shortcut/i })).not.toBeInTheDocument()
    })

    it('GIVEN isAuthored=true and no local repo matches THEN run shortcut action is shown but disabled with an explanatory title', () => {
      useBranchStore.setState({ localPaths: [] })
      renderCard(<PRCard pr={pr} isAuthored />)
      const button = screen.getByRole('button', { name: /add this repo in the branches tab/i })
      expect(button).toBeDisabled()
    })

    it('GIVEN isAuthored=true and a local repo matches THEN run shortcut action is shown enabled', () => {
      useBranchStore.setState({ localPaths: ['/Users/me/code/repo'] })
      renderCard(<PRCard pr={pr} isAuthored />)
      const button = screen.getByRole('button', { name: 'Run shortcut' })
      expect(button).not.toBeDisabled()
    })

    it('GIVEN isAuthored=true and no local repo matches WHEN the disabled action is clicked THEN the shortcuts modal does not open', async () => {
      useBranchStore.setState({ localPaths: [] })
      const user = userEvent.setup()
      renderCard(<PRCard pr={pr} isAuthored />)
      const button = screen.getByRole('button', { name: /add this repo in the branches tab/i })
      await user.click(button)
      expect(
        screen.queryByText(`Shortcuts · ${pr.repository.nameWithOwner} #${pr.number}`)
      ).not.toBeInTheDocument()
    })
  })

  describe('draft badge', () => {
    it('GIVEN isDraft true WHEN rendered THEN shows Draft badge', () => {
      renderCard(<PRCard pr={{ ...pr, isDraft: true }} />)
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('GIVEN isDraft false WHEN rendered THEN no Draft badge', () => {
      renderCard(<PRCard pr={pr} />)
      expect(screen.queryByText('Draft')).not.toBeInTheDocument()
    })
  })
})
