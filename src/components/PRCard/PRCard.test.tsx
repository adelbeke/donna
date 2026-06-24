import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PRCard from './PRCard'
import { usePRStore } from '../../store/prStore'
import type { PullRequest, ReviewState } from '../../types/github'

vi.mock('../../hooks/useCheckContexts', () => ({
  useCheckContexts: vi.fn(() => ({ checks: [], isLoading: false })),
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
  usePRStore.setState({ priorityIds: [], hiddenIds: [], filters: {
    section: 'review-requested', repos: [], hiddenAuthors: [],
    showDrafts: false, showHidden: false, search: '',
  }})
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
    const starBtn = screen.getByTitle('Mark as top priority')
    await user.click(starBtn)
    expect(usePRStore.getState().priorityIds).toContain('pr-42')
  })

  it('star button click again removes priority', async () => {
    const user = userEvent.setup()
    usePRStore.setState({ priorityIds: ['pr-42'] })
    render(<PRCard pr={pr} />)
    const starBtn = screen.getByTitle('Remove priority')
    await user.click(starBtn)
    expect(usePRStore.getState().priorityIds).not.toContain('pr-42')
  })

  describe('ChecksPanel rollup state footer', () => {
    const greenCheck = {
      __typename: 'CheckRun' as const,
      name: 'CI',
      status: 'COMPLETED' as const,
      conclusion: 'SUCCESS' as const,
      detailsUrl: null,
    }

    function makePrWithRollup(state: 'PENDING' | 'EXPECTED' | 'SUCCESS') {
      return {
        ...pr,
        commits: {
          nodes: [{
            commit: {
              statusCheckRollup: {
                state,
                contexts: { nodes: [greenCheck] },
              },
            },
          }],
        },
      }
    }

    it('GIVEN rollup EXPECTED with all-green contexts WHEN checks opened THEN footer note appears', async () => {
      const user = userEvent.setup()
      render(<PRCard pr={makePrWithRollup('EXPECTED')} />)
      await user.click(screen.getByText('Checks pending'))
      expect(screen.getByText('Some checks may still be pending or not yet shown')).toBeInTheDocument()
    })

    it('GIVEN rollup PENDING with all-green contexts WHEN checks opened THEN footer note appears', async () => {
      const user = userEvent.setup()
      render(<PRCard pr={makePrWithRollup('PENDING')} />)
      await user.click(screen.getByText('Checks pending'))
      expect(screen.getByText('Some checks may still be pending or not yet shown')).toBeInTheDocument()
    })

    it('GIVEN rollup SUCCESS WHEN checks opened THEN no footer note', async () => {
      const user = userEvent.setup()
      render(<PRCard pr={makePrWithRollup('SUCCESS')} />)
      await user.click(screen.getByText('Checks pass'))
      expect(screen.queryByText('Some checks may still be pending or not yet shown')).not.toBeInTheDocument()
    })
  })

  describe('review state badge', () => {
    function prWithReview(state: ReviewState) {
      return { ...pr, myReviewState: state }
    }

    it('GIVEN myReviewState APPROVED WHEN rendered THEN shows Approved badge', () => {
      render(<PRCard pr={prWithReview('APPROVED')} />)
      expect(screen.getByText('Approved')).toBeInTheDocument()
    })

    it('GIVEN myReviewState CHANGES_REQUESTED WHEN rendered THEN shows Changes requested badge', () => {
      render(<PRCard pr={prWithReview('CHANGES_REQUESTED')} />)
      expect(screen.getByText('Changes requested')).toBeInTheDocument()
    })

    it('GIVEN myReviewState COMMENTED WHEN rendered THEN shows Commented badge', () => {
      render(<PRCard pr={prWithReview('COMMENTED')} />)
      expect(screen.getByText('Commented')).toBeInTheDocument()
    })

    it('GIVEN no myReviewState WHEN rendered THEN no review badge', () => {
      render(<PRCard pr={{ ...pr, myReviewState: null }} />)
      expect(screen.queryByText('Approved')).not.toBeInTheDocument()
      expect(screen.queryByText('Changes requested')).not.toBeInTheDocument()
    })

    it('GIVEN isAuthored=true with APPROVED state WHEN rendered THEN no review badge shown', () => {
      render(<PRCard pr={prWithReview('APPROVED')} isAuthored />)
      expect(screen.queryByText('Approved')).not.toBeInTheDocument()
    })
  })

  describe('CI checks badge', () => {
    function prWithCheckState(state: 'SUCCESS' | 'FAILURE' | 'PENDING') {
      return {
        ...pr,
        commits: {
          nodes: [{
            commit: {
              statusCheckRollup: { state, contexts: { nodes: [] } },
            },
          }],
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
