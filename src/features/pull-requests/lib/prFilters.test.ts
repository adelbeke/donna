import { describe, it, expect } from 'vitest'
import { applyFilters } from './prFilters'
import type { PullRequest } from '@/types/github'
import type { GlobalFilters, ViewFilters } from '../stores/prStore'

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

const baseGlobal: GlobalFilters = {
  hiddenAuthors: [],
  hiddenRepos: [],
  showHidden: false,
}

const baseView: ViewFilters = {
  repos: [],
  showDrafts: true,
  search: '',
}

describe('applyFilters — hiddenAuthors exact match', () => {
  it('hides a PR whose author exactly matches a muted entry', () => {
    // GIVEN renovate is muted
    const global = { ...baseGlobal, hiddenAuthors: ['renovate'] }
    // WHEN filtering a PR by renovate on review-requested section
    const actual = applyFilters([makePR('renovate')], global, baseView, 'review-requested')
    // THEN the PR is hidden
    expect(actual).toHaveLength(0)
  })

  it('does NOT hide a PR whose author only partially matches', () => {
    // GIVEN renovate is muted
    const global = { ...baseGlobal, hiddenAuthors: ['renovate'] }
    // WHEN filtering a PR by doctolib-renovate
    const actual = applyFilters([makePR('doctolib-renovate')], global, baseView, 'review-requested')
    // THEN the PR is visible
    expect(actual).toHaveLength(1)
  })

  it('is case-insensitive', () => {
    // GIVEN Renovate (capitalised) is muted
    const global = { ...baseGlobal, hiddenAuthors: ['Renovate'] }
    // WHEN filtering a PR by renovate (lowercase)
    const actual = applyFilters([makePR('renovate')], global, baseView, 'review-requested')
    // THEN the PR is hidden
    expect(actual).toHaveLength(0)
  })

  it('does not hide unrelated authors', () => {
    // GIVEN renovate is muted
    const global = { ...baseGlobal, hiddenAuthors: ['renovate'] }
    // WHEN filtering a PR by dependabot
    const actual = applyFilters([makePR('dependabot')], global, baseView, 'review-requested')
    // THEN the PR is visible
    expect(actual).toHaveLength(1)
  })

  it('shows muted-author PRs when showHidden is true', () => {
    // GIVEN renovate is muted but showHidden is on
    const global = { ...baseGlobal, hiddenAuthors: ['renovate'], showHidden: true }
    // WHEN filtering a PR by renovate
    const actual = applyFilters([makePR('renovate')], global, baseView, 'review-requested')
    // THEN the PR is visible because showHidden overrides the mute
    expect(actual).toHaveLength(1)
  })

  it('does NOT apply hiddenAuthors to authored section', () => {
    // GIVEN renovate is muted
    const global = { ...baseGlobal, hiddenAuthors: ['renovate'] }
    // WHEN viewing authored PRs
    const actual = applyFilters([makePR('renovate')], global, baseView, 'authored')
    // THEN PR still shows (you authored it, you should see it)
    expect(actual).toHaveLength(1)
  })
})

describe('applyFilters — hiddenRepos deny-list', () => {
  const orgPR = {
    ...makePR('author'),
    repository: { nameWithOwner: 'myorg/awesome-repo' },
  } as PullRequest

  it('hides a PR by exact owner/repo match', () => {
    // GIVEN myorg/awesome-repo is denied
    const global = { ...baseGlobal, hiddenRepos: ['myorg/awesome-repo'] }
    const actual = applyFilters([orgPR], global, baseView, 'review-requested')
    expect(actual).toHaveLength(0)
  })

  it('hides a PR by org-level match', () => {
    // GIVEN myorg (all repos) is denied
    const global = { ...baseGlobal, hiddenRepos: ['myorg'] }
    const actual = applyFilters([orgPR], global, baseView, 'review-requested')
    expect(actual).toHaveLength(0)
  })

  it('does NOT hide a PR from a different org', () => {
    // GIVEN otherapg is denied but PR is from myorg
    const global = { ...baseGlobal, hiddenRepos: ['otherorg'] }
    const actual = applyFilters([orgPR], global, baseView, 'review-requested')
    expect(actual).toHaveLength(1)
  })

  it('shows denied-repo PRs when showHidden is true', () => {
    // GIVEN myorg is denied but showHidden is on
    const global = { ...baseGlobal, hiddenRepos: ['myorg'], showHidden: true }
    const actual = applyFilters([orgPR], global, baseView, 'review-requested')
    expect(actual).toHaveLength(1)
  })

  it('does NOT apply hiddenRepos to authored section', () => {
    // GIVEN myorg is denied
    const global = { ...baseGlobal, hiddenRepos: ['myorg'] }
    // WHEN viewing authored PRs
    const actual = applyFilters([orgPR], global, baseView, 'authored')
    // THEN PR still shows (it's your own PR)
    expect(actual).toHaveLength(1)
  })
})

describe('applyFilters — showDrafts', () => {
  const draftPR = { ...makePR('author'), isDraft: true } as PullRequest

  it('hides draft PRs when showDrafts is false', () => {
    // GIVEN showDrafts is off
    const view = { ...baseView, showDrafts: false }
    // WHEN filtering a draft PR
    const actual = applyFilters([draftPR], baseGlobal, view, 'review-requested')
    // THEN the draft is hidden
    expect(actual).toHaveLength(0)
  })

  it('shows draft PRs when showDrafts is true', () => {
    // GIVEN showDrafts is on
    const actual = applyFilters([draftPR], baseGlobal, baseView, 'review-requested')
    // THEN the draft is visible
    expect(actual).toHaveLength(1)
  })
})

describe('applyFilters — repos allow-list', () => {
  const repoPR = { ...makePR('author'), repository: { nameWithOwner: 'org/repo-a' } } as PullRequest

  it('keeps PRs from selected repos', () => {
    // GIVEN org/repo-a is selected
    const view = { ...baseView, repos: ['org/repo-a'] }
    const actual = applyFilters([repoPR], baseGlobal, view, 'review-requested')
    expect(actual).toHaveLength(1)
  })

  it('hides PRs from repos not in the selection', () => {
    // GIVEN org/repo-b is selected
    const view = { ...baseView, repos: ['org/repo-b'] }
    const actual = applyFilters([repoPR], baseGlobal, view, 'review-requested')
    expect(actual).toHaveLength(0)
  })

  it('shows all repos when repos list is empty', () => {
    const actual = applyFilters([repoPR], baseGlobal, baseView, 'review-requested')
    expect(actual).toHaveLength(1)
  })
})

describe('applyFilters — search', () => {
  const pr = { ...makePR('author'), title: 'fix: update login flow' } as PullRequest

  it('matches PRs whose title contains the search string', () => {
    const view = { ...baseView, search: 'login' }
    const actual = applyFilters([pr], baseGlobal, view, 'review-requested')
    expect(actual).toHaveLength(1)
  })

  it('is case-insensitive', () => {
    const view = { ...baseView, search: 'LOGIN' }
    const actual = applyFilters([pr], baseGlobal, view, 'review-requested')
    expect(actual).toHaveLength(1)
  })

  it('excludes PRs that do not match', () => {
    const view = { ...baseView, search: 'payment' }
    const actual = applyFilters([pr], baseGlobal, view, 'review-requested')
    expect(actual).toHaveLength(0)
  })
})
