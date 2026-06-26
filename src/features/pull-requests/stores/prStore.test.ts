import { describe, it, expect, beforeEach } from 'vitest'
import { usePRStore } from './prStore'

beforeEach(() => {
  usePRStore.setState({
    section: 'review-requested',
    globalFilters: { hiddenAuthors: [], hiddenRepos: [], showHidden: false },
    viewFilters: {
      'review-requested': { repos: [], showDrafts: false, search: '' },
      authored: { repos: [], showDrafts: false, search: '' },
      mentioned: { repos: [], showDrafts: false, search: '' },
    },
    priorityIds: [],
    hiddenIds: [],
  })
})

describe('prStore', () => {
  it('setViewFilters merges partial update', () => {
    usePRStore.getState().setViewFilters('review-requested', { search: 'foo' })
    const { viewFilters, section } = usePRStore.getState()
    expect(viewFilters[section].search).toBe('foo')
    expect(section).toBe('review-requested')
  })

  it('setSection changes the active section', () => {
    usePRStore.getState().setSection('authored')
    expect(usePRStore.getState().section).toBe('authored')
  })

  it('togglePriority adds an id', () => {
    usePRStore.getState().togglePriority('pr-1')
    expect(usePRStore.getState().priorityIds).toContain('pr-1')
  })

  it('togglePriority removes an existing id', () => {
    usePRStore.getState().togglePriority('pr-1')
    usePRStore.getState().togglePriority('pr-1')
    expect(usePRStore.getState().priorityIds).not.toContain('pr-1')
  })

  it('togglePriority does not duplicate', () => {
    usePRStore.getState().togglePriority('pr-1')
    usePRStore.getState().togglePriority('pr-2')
    expect(usePRStore.getState().priorityIds).toHaveLength(2)
  })

  it('addHiddenAuthor adds a pattern', () => {
    usePRStore.getState().addHiddenAuthor('renovate')
    expect(usePRStore.getState().globalFilters.hiddenAuthors).toContain('renovate')
  })

  it('addHiddenAuthor normalizes to lowercase', () => {
    usePRStore.getState().addHiddenAuthor('Renovate')
    expect(usePRStore.getState().globalFilters.hiddenAuthors).toContain('renovate')
    expect(usePRStore.getState().globalFilters.hiddenAuthors).not.toContain('Renovate')
  })

  it('addHiddenAuthor does not duplicate case-insensitively', () => {
    usePRStore.getState().addHiddenAuthor('Renovate')
    usePRStore.getState().addHiddenAuthor('renovate')
    expect(usePRStore.getState().globalFilters.hiddenAuthors).toHaveLength(1)
  })

  it('removeHiddenAuthor removes an existing pattern', () => {
    usePRStore.getState().addHiddenAuthor('dependabot')
    usePRStore.getState().removeHiddenAuthor('dependabot')
    expect(usePRStore.getState().globalFilters.hiddenAuthors).not.toContain('dependabot')
  })

  it('removeHiddenAuthor is a no-op for unknown pattern', () => {
    usePRStore.getState().addHiddenAuthor('renovate')
    usePRStore.getState().removeHiddenAuthor('unknown')
    expect(usePRStore.getState().globalFilters.hiddenAuthors).toHaveLength(1)
  })

  it('addHiddenRepo adds a repo', () => {
    usePRStore.getState().addHiddenRepo('myorg/repo')
    expect(usePRStore.getState().globalFilters.hiddenRepos).toContain('myorg/repo')
  })

  it('addHiddenRepo normalizes to lowercase', () => {
    usePRStore.getState().addHiddenRepo('MyOrg/Repo')
    expect(usePRStore.getState().globalFilters.hiddenRepos).toContain('myorg/repo')
  })

  it('addHiddenRepo does not duplicate', () => {
    usePRStore.getState().addHiddenRepo('myorg/repo')
    usePRStore.getState().addHiddenRepo('myorg/repo')
    expect(usePRStore.getState().globalFilters.hiddenRepos).toHaveLength(1)
  })

  it('removeHiddenRepo removes an existing repo', () => {
    usePRStore.getState().addHiddenRepo('myorg/repo')
    usePRStore.getState().removeHiddenRepo('myorg/repo')
    expect(usePRStore.getState().globalFilters.hiddenRepos).not.toContain('myorg/repo')
  })

  it('toggleHide adds id when not hidden', () => {
    usePRStore.getState().toggleHide('pr-1')
    expect(usePRStore.getState().hiddenIds).toContain('pr-1')
  })

  it('toggleHide removes id when already hidden', () => {
    usePRStore.getState().toggleHide('pr-1')
    usePRStore.getState().toggleHide('pr-1')
    expect(usePRStore.getState().hiddenIds).not.toContain('pr-1')
  })

  it('resetFilters resets only the current section view filters', () => {
    usePRStore.getState().setViewFilters('review-requested', { search: 'foo', showDrafts: true, repos: ['org/repo'] })
    usePRStore.getState().addHiddenAuthor('renovate')
    usePRStore.getState().resetFilters()
    const { viewFilters, globalFilters } = usePRStore.getState()
    expect(viewFilters['review-requested'].search).toBe('')
    expect(viewFilters['review-requested'].showDrafts).toBe(false)
    expect(viewFilters['review-requested'].repos).toEqual([])
    // global filters are preserved
    expect(globalFilters.hiddenAuthors).toContain('renovate')
  })
})
