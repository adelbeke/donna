import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PRCard } from './PRCard'
import { usePRStore } from '../../stores/prStore'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { usePRDetails } from '../../queries/usePRDetails'
import { useCheckContexts } from '../../queries/useCheckContexts'
import type { PullRequest, ReviewState } from '@/types/github'

const mockUsePRDetails = vi.mocked(usePRDetails)
const mockUseCheckContexts = vi.mocked(useCheckContexts)

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
  usePRStore.setState({ priorityIds: [], hiddenIds: [] })
  useAuthStore.setState({ user: { login: 'viewer', avatarUrl: '', name: 'Viewer' }, token: 'test' })
  mockUsePRDetails.mockReturnValue({ data: undefined } as never)
  mockUseCheckContexts.mockReturnValue({ checks: [], isLoading: false, refetch: vi.fn() } as never)
})

describe('PRCard', () => {
  it('GIVEN author is null WHEN rendered THEN does not crash', () => {
    const prNoAuthor: PullRequest = { ...pr, author: null }
    render(<PRCard pr={prNoAuthor} />)
    expect(screen.getByText('Fix the thing')).toBeInTheDocument()
  })

  it('renders opened timestamp', () => {
    render(<PRCard pr={pr} />)
    expect(screen.getByText(/opened/)).toBeInTheDocument()
  })

  it('renders updated timestamp', () => {
    render(<PRCard pr={pr} />)
    expect(screen.getByText(/updated/)).toBeInTheDocument()
  })

  it('renders PR title', () => {
    render(<PRCard pr={pr} />)
    expect(screen.getByText('Fix the thing')).toBeInTheDocument()
  })

  it('renders repo name', () => {
    render(<PRCard pr={pr} />)
    expect(screen.getByText('org/repo')).toBeInTheDocument()
  })

  it('star button click toggles priority in store', async () => {
    const user = userEvent.setup()
    render(<PRCard pr={pr} />)
    const starBtn = screen.getByRole('button', { name: 'Mark as top priority' })
    await user.click(starBtn)
    expect(usePRStore.getState().priorityIds).toContain('pr-42')
  })

  it('star button click again removes priority', async () => {
    const user = userEvent.setup()
    usePRStore.setState({ priorityIds: ['pr-42'] })
    render(<PRCard pr={pr} />)
    const starBtn = screen.getByRole('button', { name: 'Remove priority' })
    await user.click(starBtn)
    expect(usePRStore.getState().priorityIds).not.toContain('pr-42')
  })

  it('GIVEN showHideAndStar=false WHEN rendered THEN hide and star buttons are not shown', () => {
    render(<PRCard pr={pr} showHideAndStar={false} />)
    expect(screen.queryByRole('button', { name: 'Hide PR (Donna only)' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark as top priority' })).not.toBeInTheDocument()
  })

  describe('clicking the card', () => {
    it('GIVEN card body clicked THEN opens the PR in a new tab', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      const user = userEvent.setup()
      render(<PRCard pr={pr} />)
      await user.click(screen.getByText('org/repo'))
      expect(openSpy).toHaveBeenCalledWith(pr.url, '_blank', 'noopener,noreferrer')
      openSpy.mockRestore()
    })

    it('GIVEN star button clicked THEN does not also open the PR', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      const user = userEvent.setup()
      render(<PRCard pr={pr} />)
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
      render(<PRCard pr={makePrWithRollup('EXPECTED')} />)
      await user.click(screen.getByText('Checks pending'))
      expect(
        screen.getByText('Some checks may still be pending or not yet shown')
      ).toBeInTheDocument()
    })

    it('GIVEN rollup PENDING with all-green contexts WHEN checks opened THEN footer note appears', async () => {
      const user = userEvent.setup()
      render(<PRCard pr={makePrWithRollup('PENDING')} />)
      await user.click(screen.getByText('Checks pending'))
      expect(
        screen.getByText('Some checks may still be pending or not yet shown')
      ).toBeInTheDocument()
    })

    it('GIVEN rollup SUCCESS WHEN checks opened THEN no footer note', async () => {
      const user = userEvent.setup()
      render(<PRCard pr={makePrWithRollup('SUCCESS')} />)
      await user.click(screen.getByText('Checks pass'))
      expect(
        screen.queryByText('Some checks may still be pending or not yet shown')
      ).not.toBeInTheDocument()
    })

    it('GIVEN checks modal open WHEN reload button clicked THEN refetch is called', async () => {
      const refetch = vi.fn()
      mockUseCheckContexts.mockReturnValue({ checks: [], isLoading: false, refetch } as never)
      const user = userEvent.setup()
      render(<PRCard pr={makePrWithRollup('SUCCESS')} />)
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
      render(<PRCard pr={pr} />)
      expect(screen.getByText('Approved')).toBeInTheDocument()
    })

    it('GIVEN details returns CHANGES_REQUESTED review WHEN rendered THEN shows Changes requested badge', () => {
      mockUsePRDetails.mockReturnValue(makeDetailsWithReview('CHANGES_REQUESTED') as never)
      render(<PRCard pr={pr} />)
      expect(screen.getByText('Changes requested')).toBeInTheDocument()
    })

    it('GIVEN details returns COMMENTED review WHEN rendered THEN shows Commented badge', () => {
      mockUsePRDetails.mockReturnValue(makeDetailsWithReview('COMMENTED') as never)
      render(<PRCard pr={pr} />)
      expect(screen.getByText('Commented')).toBeInTheDocument()
    })

    it('GIVEN details returns no matching review WHEN rendered THEN no review badge', () => {
      render(<PRCard pr={pr} />)
      expect(screen.queryByText('Approved')).not.toBeInTheDocument()
      expect(screen.queryByText('Changes requested')).not.toBeInTheDocument()
    })

    it('GIVEN isAuthored=true WHEN rendered THEN no review badge shown', () => {
      mockUsePRDetails.mockReturnValue(makeDetailsWithReview('APPROVED') as never)
      render(<PRCard pr={pr} isAuthored />)
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
      render(<PRCard pr={prWithCheckState('SUCCESS')} />)
      expect(screen.getByText('Checks pass')).toBeInTheDocument()
    })

    it('GIVEN FAILURE rollup WHEN rendered THEN shows Checks failed badge', () => {
      render(<PRCard pr={prWithCheckState('FAILURE')} />)
      expect(screen.getByText('Checks failed')).toBeInTheDocument()
    })

    it('GIVEN PENDING rollup WHEN rendered THEN shows Checks pending badge', () => {
      render(<PRCard pr={prWithCheckState('PENDING')} />)
      expect(screen.getByText('Checks pending')).toBeInTheDocument()
    })

    it('GIVEN no commits WHEN rendered THEN no CI badge', () => {
      render(<PRCard pr={{ ...pr, commits: { nodes: [] } }} />)
      expect(screen.queryByText('Checks pass')).not.toBeInTheDocument()
      expect(screen.queryByText('Checks failed')).not.toBeInTheDocument()
    })
  })

  describe('conflict badge', () => {
    it('GIVEN mergeable CONFLICTING WHEN rendered THEN shows Conflict badge', () => {
      render(<PRCard pr={{ ...pr, mergeable: 'CONFLICTING' }} />)
      expect(screen.getByText('Conflict')).toBeInTheDocument()
    })

    it('GIVEN mergeable MERGEABLE WHEN rendered THEN no Conflict badge', () => {
      render(<PRCard pr={{ ...pr, mergeable: 'MERGEABLE' }} />)
      expect(screen.queryByText('Conflict')).not.toBeInTheDocument()
    })
  })

  describe('draft badge', () => {
    it('GIVEN isDraft true WHEN rendered THEN shows Draft badge', () => {
      render(<PRCard pr={{ ...pr, isDraft: true }} />)
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('GIVEN isDraft false WHEN rendered THEN no Draft badge', () => {
      render(<PRCard pr={pr} />)
      expect(screen.queryByText('Draft')).not.toBeInTheDocument()
    })
  })
})
