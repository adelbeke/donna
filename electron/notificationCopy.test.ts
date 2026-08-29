import { describe, it, expect } from 'vitest'
import {
  buildSearchQuery,
  diffNewIds,
  filterDrafts,
  filterMuted,
  formatNewPRNotification,
  isRepoMatchedBy,
} from './notificationCopy'
import type { NewPRNode } from './notificationCopy'

const givenPR = (overrides: Partial<NewPRNode> = {}): NewPRNode => ({
  number: 42,
  title: 'Fix the thing',
  author: { login: 'octocat' },
  repository: { nameWithOwner: 'acme/donna' },
  ...overrides,
})

describe('buildSearchQuery', () => {
  it('builds a review-requested search for the given login', () => {
    expect(buildSearchQuery('review-requested', 'octocat')).toBe(
      'is:open is:pr archived:false sort:updated-desc review-requested:octocat'
    )
  })

  it('builds an assigned search excluding PRs authored by the login', () => {
    expect(buildSearchQuery('assigned', 'octocat')).toBe(
      'is:open is:pr archived:false sort:updated-desc assignee:octocat -author:octocat'
    )
  })
})

describe('diffNewIds', () => {
  it('returns fetched ids not present in seenIds', () => {
    expect(diffNewIds(['a', 'b', 'c'], ['a'])).toEqual(['b', 'c'])
  })

  it('returns nothing when everything was already seen', () => {
    expect(diffNewIds(['a', 'b'], ['a', 'b'])).toEqual([])
  })
})

describe('formatNewPRNotification', () => {
  it('formats a single new review-requested PR', () => {
    const result = formatNewPRNotification('review-requested', [givenPR()])
    expect(result).toEqual({
      title: 'New review request',
      body: 'acme/donna#42 · Fix the thing — by octocat',
    })
  })

  it('formats a single new assigned PR', () => {
    const result = formatNewPRNotification('assigned', [givenPR()])
    expect(result.title).toBe('You were assigned')
  })

  it('formats multiple new PRs in the same category/tick, truncating repo names at 3', () => {
    const nodes = [
      givenPR({ repository: { nameWithOwner: 'acme/donna' } }),
      givenPR({ repository: { nameWithOwner: 'acme/api' } }),
      givenPR({ repository: { nameWithOwner: 'acme/web' } }),
      givenPR({ repository: { nameWithOwner: 'acme/infra' } }),
    ]
    const result = formatNewPRNotification('review-requested', nodes)
    expect(result).toEqual({
      title: '4 new review requests',
      body: 'donna, api, web and 1 more',
    })
  })

  it('does not append "and N more" when repo names fit within the truncation limit', () => {
    const nodes = [
      givenPR({ repository: { nameWithOwner: 'acme/donna' } }),
      givenPR({ repository: { nameWithOwner: 'acme/api' } }),
    ]
    const result = formatNewPRNotification('assigned', nodes)
    expect(result).toEqual({ title: '2 new assignments', body: 'donna, api' })
  })
})

describe('isRepoMatchedBy', () => {
  it('matches an exact owner/repo pattern', () => {
    expect(isRepoMatchedBy('acme/donna', 'acme/donna')).toBe(true)
    expect(isRepoMatchedBy('acme/donna', 'acme/other')).toBe(false)
  })

  it('matches org-wide when the pattern has no slash', () => {
    expect(isRepoMatchedBy('acme/donna', 'acme')).toBe(true)
    expect(isRepoMatchedBy('other/donna', 'acme')).toBe(false)
  })
})

describe('filterMuted', () => {
  it('drops PRs from a muted author, case-insensitively', () => {
    const nodes = [
      givenPR({ author: { login: 'Dependabot' } }),
      givenPR({ author: { login: 'octocat' } }),
    ]
    expect(filterMuted(nodes, ['dependabot'], [])).toEqual([nodes[1]])
  })

  it('drops PRs from a muted repo (org-wide pattern)', () => {
    const nodes = [
      givenPR({ repository: { nameWithOwner: 'acme/donna' } }),
      givenPR({ repository: { nameWithOwner: 'other/donna' } }),
    ]
    expect(filterMuted(nodes, [], ['acme'])).toEqual([nodes[1]])
  })

  it('keeps PRs with no author untouched by author muting', () => {
    const nodes = [givenPR({ author: null })]
    expect(filterMuted(nodes, ['dependabot'], [])).toEqual(nodes)
  })
})

describe('filterDrafts', () => {
  it('drops draft PRs when showDrafts is off', () => {
    const nodes = [{ isDraft: true }, { isDraft: false }]
    expect(filterDrafts(nodes, false)).toEqual([{ isDraft: false }])
  })

  it('keeps draft PRs when showDrafts is on', () => {
    const nodes = [{ isDraft: true }, { isDraft: false }]
    expect(filterDrafts(nodes, true)).toEqual(nodes)
  })
})
