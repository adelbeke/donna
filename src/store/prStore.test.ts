import { describe, it, expect, beforeEach } from 'vitest'
import { usePRStore } from './prStore'

beforeEach(() => {
  usePRStore.setState({
    filters: {
      section: 'review-requested',
      repos: [],
      reviewStates: [],
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
})
