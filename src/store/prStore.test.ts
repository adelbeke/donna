import { describe, it, expect, beforeEach } from 'vitest'
import { usePRStore } from './prStore'

beforeEach(() => {
  usePRStore.setState({
    filters: {
      section: 'review-requested',
      repos: [],
      hiddenAuthors: [],
      showDrafts: false,
      showHidden: false,
      search: '',
    },
    priorityIds: [],
    hiddenIds: [],
  })
})

describe('prStore', () => {
  it('setFilters merges partial update', () => {
    usePRStore.getState().setFilters({ search: 'foo' })
    const { filters } = usePRStore.getState()
    expect(filters.search).toBe('foo')
    expect(filters.section).toBe('review-requested')
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
    expect(usePRStore.getState().filters.hiddenAuthors).toContain('renovate')
  })

  it('addHiddenAuthor normalizes to lowercase', () => {
    usePRStore.getState().addHiddenAuthor('Renovate')
    expect(usePRStore.getState().filters.hiddenAuthors).toContain('renovate')
    expect(usePRStore.getState().filters.hiddenAuthors).not.toContain('Renovate')
  })

  it('addHiddenAuthor does not duplicate case-insensitively', () => {
    usePRStore.getState().addHiddenAuthor('Renovate')
    usePRStore.getState().addHiddenAuthor('renovate')
    expect(usePRStore.getState().filters.hiddenAuthors).toHaveLength(1)
  })

  it('removeHiddenAuthor removes an existing pattern', () => {
    usePRStore.getState().addHiddenAuthor('dependabot')
    usePRStore.getState().removeHiddenAuthor('dependabot')
    expect(usePRStore.getState().filters.hiddenAuthors).not.toContain('dependabot')
  })

  it('removeHiddenAuthor is a no-op for unknown pattern', () => {
    usePRStore.getState().addHiddenAuthor('renovate')
    usePRStore.getState().removeHiddenAuthor('unknown')
    expect(usePRStore.getState().filters.hiddenAuthors).toHaveLength(1)
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

  it('resetFilters resets all filters to defaults', () => {
    usePRStore.getState().setFilters({ search: 'foo', section: 'authored', showDrafts: true })
    usePRStore.getState().resetFilters()
    const { filters } = usePRStore.getState()
    expect(filters.search).toBe('')
    expect(filters.section).toBe('review-requested')
    expect(filters.showDrafts).toBe(false)
    expect(filters.repos).toEqual([])
    expect(filters.hiddenAuthors).toEqual([])
    expect(filters.showHidden).toBe(false)
  })
})
