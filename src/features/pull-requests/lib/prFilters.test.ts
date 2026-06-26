import { describe, it, expect } from 'vitest'
import { applyFilters } from './prFilters'
import type { PullRequest } from '@/types/github'
import type { PRFilters } from '../stores/prStore'

const makePR = (login: string): PullRequest =>
  ({
    id: login,
    title: 'Test PR',
    url: 'https://github.com/test/repo/pull/1',
    isDraft: false,
    isHidden: false,
    author: { login },
    repository: { nameWithOwner: 'test/repo' },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }) as unknown as PullRequest

const baseFilters: PRFilters = {
  section: 'review-requested',
  showHidden: false,
  showDrafts: true,
  repos: [],
  search: '',
  hiddenAuthors: [],
}

describe('applyFilters — hiddenAuthors exact match', () => {
  it('hides a PR whose author exactly matches a muted entry', () => {
    // GIVEN renovate is muted
    const filters = { ...baseFilters, hiddenAuthors: ['renovate'] }
    // WHEN filtering a PR by renovate
    const actual = applyFilters([makePR('renovate')], filters)
    // THEN the PR is hidden
    expect(actual).toHaveLength(0)
  })

  it('does NOT hide a PR whose author only partially matches', () => {
    // GIVEN renovate is muted
    const filters = { ...baseFilters, hiddenAuthors: ['renovate'] }
    // WHEN filtering a PR by doctolib-renovate
    const actual = applyFilters([makePR('doctolib-renovate')], filters)
    // THEN the PR is visible
    expect(actual).toHaveLength(1)
  })

  it('is case-insensitive', () => {
    // GIVEN Renovate (capitalised) is muted
    const filters = { ...baseFilters, hiddenAuthors: ['Renovate'] }
    // WHEN filtering a PR by renovate (lowercase)
    const actual = applyFilters([makePR('renovate')], filters)
    // THEN the PR is hidden
    expect(actual).toHaveLength(0)
  })

  it('does not hide unrelated authors', () => {
    // GIVEN renovate is muted
    const filters = { ...baseFilters, hiddenAuthors: ['renovate'] }
    // WHEN filtering a PR by dependabot
    const actual = applyFilters([makePR('dependabot')], filters)
    // THEN the PR is visible
    expect(actual).toHaveLength(1)
  })

  it('shows muted-author PRs when showHidden is true', () => {
    // GIVEN renovate is muted but showHidden is on
    const filters = { ...baseFilters, hiddenAuthors: ['renovate'], showHidden: true }
    // WHEN filtering a PR by renovate
    const actual = applyFilters([makePR('renovate')], filters)
    // THEN the PR is visible because showHidden overrides the mute
    expect(actual).toHaveLength(1)
  })
})

describe('applyFilters — showDrafts', () => {
  const draftPR = { ...makePR('author'), isDraft: true } as PullRequest

  it('hides draft PRs when showDrafts is false', () => {
    // GIVEN showDrafts is off
    const filters = { ...baseFilters, showDrafts: false }
    // WHEN filtering a draft PR
    const actual = applyFilters([draftPR], filters)
    // THEN the draft is hidden
    expect(actual).toHaveLength(0)
  })

  it('shows draft PRs when showDrafts is true', () => {
    // GIVEN showDrafts is on
    const filters = { ...baseFilters, showDrafts: true }
    // WHEN filtering a draft PR
    const actual = applyFilters([draftPR], filters)
    // THEN the draft is visible
    expect(actual).toHaveLength(1)
  })
})

describe('applyFilters — repos', () => {
  const repoPR = { ...makePR('author'), repository: { nameWithOwner: 'org/repo-a' } } as PullRequest

  it('keeps PRs from selected repos', () => {
    // GIVEN org/repo-a is selected
    const filters = { ...baseFilters, repos: ['org/repo-a'] }
    // WHEN filtering
    const actual = applyFilters([repoPR], filters)
    // THEN the PR is included
    expect(actual).toHaveLength(1)
  })

  it('hides PRs from repos not in the selection', () => {
    // GIVEN org/repo-b is selected
    const filters = { ...baseFilters, repos: ['org/repo-b'] }
    // WHEN filtering a PR from org/repo-a
    const actual = applyFilters([repoPR], filters)
    // THEN the PR is excluded
    expect(actual).toHaveLength(0)
  })

  it('shows all repos when repos list is empty', () => {
    // GIVEN no repo filter
    const filters = { ...baseFilters, repos: [] }
    const actual = applyFilters([repoPR], filters)
    expect(actual).toHaveLength(1)
  })
})

describe('applyFilters — search', () => {
  const pr = { ...makePR('author'), title: 'fix: update login flow' } as PullRequest

  it('matches PRs whose title contains the search string', () => {
    // GIVEN search is "login"
    const filters = { ...baseFilters, search: 'login' }
    const actual = applyFilters([pr], filters)
    expect(actual).toHaveLength(1)
  })

  it('is case-insensitive', () => {
    // GIVEN search is "LOGIN"
    const filters = { ...baseFilters, search: 'LOGIN' }
    const actual = applyFilters([pr], filters)
    expect(actual).toHaveLength(1)
  })

  it('excludes PRs that do not match', () => {
    // GIVEN search is "payment"
    const filters = { ...baseFilters, search: 'payment' }
    const actual = applyFilters([pr], filters)
    expect(actual).toHaveLength(0)
  })
})
