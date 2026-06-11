import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PRCard from './PRCard'
import { usePRStore } from '../../store/prStore'
import type { PullRequest } from '../../types/github'

const pr: PullRequest = {
  id: 'pr-42',
  number: 42,
  title: 'Fix the thing',
  url: 'https://github.com/org/repo/pull/42',
  isDraft: false,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-02-20T12:00:00Z',
  author: { login: 'alice', avatarUrl: 'https://example.com/alice.png' },
  repository: { name: 'repo', nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
  reviewRequests: { nodes: [] },
  reviews: { nodes: [] },
  additions: 100,
  deletions: 50,
  isHidden: false,
}

beforeEach(() => {
  usePRStore.setState({ priorityIds: [], hiddenIds: [], filters: {
    section: 'review-requested', repos: [], reviewStates: [],
    showDrafts: false, showHidden: false, search: '', sortOrder: 'newest',
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
})
