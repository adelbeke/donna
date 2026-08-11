import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { PRDetailHeader } from './PRDetailHeader'
import type { PRDetailMeta } from '../../types'

vi.mock('@/features/pull-requests/queries/useCheckContexts', () => ({
  useCheckContexts: vi.fn(() => ({ checks: [], isLoading: false, refetch: vi.fn() })),
}))

const pr: PRDetailMeta = {
  id: 'pr-1',
  number: 42,
  title: 'Fix the thing',
  url: 'https://github.com/org/repo/pull/42',
  body: '',
  isDraft: false,
  additions: 10,
  deletions: 5,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
  baseRefName: 'main',
  headRefName: 'fix-the-thing',
  headRefOid: 'abc123',
  author: { login: 'alice', avatarUrl: '' },
  repository: { name: 'repo', nameWithOwner: 'org/repo', url: '' },
}

describe('PRDetailHeader', () => {
  it('given a pr, when rendered, then shows title, number and repo', () => {
    render(
      <MemoryRouter>
        <PRDetailHeader pr={pr} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Fix the thing/)).toBeInTheDocument()
    expect(screen.getByText('#42')).toBeInTheDocument()
    expect(screen.getByText('org/repo')).toBeInTheDocument()
  })

  it('given a draft pr, when rendered, then shows the Draft badge', () => {
    render(
      <MemoryRouter>
        <PRDetailHeader pr={{ ...pr, isDraft: true }} />
      </MemoryRouter>
    )
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('given a pr with a check rollup state, when rendered, then shows the checks badge', () => {
    const prWithChecks: PRDetailMeta = {
      ...pr,
      commits: { nodes: [{ commit: { statusCheckRollup: { state: 'SUCCESS' } } }] },
    }
    render(
      <MemoryRouter>
        <PRDetailHeader pr={prWithChecks} />
      </MemoryRouter>
    )
    expect(screen.getByText('Checks pass')).toBeInTheDocument()
  })

  it('given a pr with no commits, when rendered, then no checks badge', () => {
    render(
      <MemoryRouter>
        <PRDetailHeader pr={pr} />
      </MemoryRouter>
    )
    expect(screen.queryByText('Checks pass')).not.toBeInTheDocument()
  })

  it('given a pr, when rendered, then the GitHub link opens externally', () => {
    render(
      <MemoryRouter>
        <PRDetailHeader pr={pr} />
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: /Open on GitHub/ })
    expect(link).toHaveAttribute('href', pr.url)
    expect(link).toHaveAttribute('target', '_blank')
  })
})
