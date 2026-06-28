import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { PullRequest } from '@/types/github'
import type { GlobalFilters, PRSection, ViewFilters } from '../stores/prStore'
import { useFocusRefresh } from './useFocusRefresh'

export const makePR = (id: string, author = 'alice', repo = 'org/repo'): PullRequest =>
  ({
    id,
    number: 1,
    title: `PR ${id}`,
    url: '',
    isDraft: false,
    isHidden: false,
    isTopPriority: false,
    author: { login: author, avatarUrl: '' },
    repository: { nameWithOwner: repo },
  }) as unknown as PullRequest

const gf: GlobalFilters = { hiddenAuthors: [], hiddenRepos: [], showHidden: false }
const vf: ViewFilters = { repos: [], showDrafts: false, search: '' }
const section: PRSection = 'review-requested'

type Props = {
  allPRs: PullRequest[]
  prs: PullRequest[]
  priorityPRs: PullRequest[]
  refetch: () => void
  isFetching: boolean
  isFetchingNextPage: boolean
  globalFilters: GlobalFilters
  view: ViewFilters
  section: PRSection
}

const defaults: Props = {
  allPRs: [],
  prs: [],
  priorityPRs: [],
  refetch: vi.fn(),
  isFetching: false,
  isFetchingNextPage: false,
  globalFilters: gf,
  view: vf,
  section,
}

const useHook = (p: Props) => useFocusRefresh(p)

describe('useFocusRefresh', () => {
  it('GIVEN idle THEN displayedPRs mirrors prs', () => {
    const pr = makePR('1')
    const { result } = renderHook(() => useHook({ ...defaults, allPRs: [pr], prs: [pr] }))
    expect(result.current.displayedPRs).toEqual([pr])
    expect(result.current.newCount).toBe(0)
  })

  it('GIVEN focus fires during initial fetch THEN no snapshot taken and newCount stays 0', async () => {
    const existing = makePR('existing')
    const newPR = makePR('new')
    const refetch = vi.fn()
    const { result, rerender } = renderHook((props: Props) => useHook(props), {
      initialProps: {
        ...defaults,
        refetch,
        isFetching: true,
        allPRs: [],
        prs: [],
        priorityPRs: [],
      } as Props,
    })

    // focus fires while initial fetch is in-flight
    await act(async () => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    // fetch completes with data
    rerender({
      ...defaults,
      refetch,
      isFetching: false,
      allPRs: [existing, newPR],
      prs: [existing, newPR],
    })

    expect(result.current.newCount).toBe(0)
    expect(result.current.displayedPRs).toEqual([existing, newPR])
  })

  it('GIVEN focus fires with data loaded THEN new PR triggers badge after refetch', async () => {
    const existing = makePR('existing')
    const newPR = makePR('new')
    const refetch = vi.fn()
    const { result, rerender } = renderHook((props: Props) => useHook(props), {
      initialProps: { ...defaults, refetch, allPRs: [existing], prs: [existing], priorityPRs: [] },
    })

    // focus: snapshot taken of [existing]
    await act(async () => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    // refetch in-flight
    rerender({
      ...defaults,
      refetch,
      isFetching: true,
      allPRs: [existing],
      prs: [existing],
      priorityPRs: [],
    })
    // refetch completes with new PR
    rerender({
      ...defaults,
      refetch,
      isFetching: false,
      allPRs: [existing, newPR],
      prs: [existing, newPR],
      priorityPRs: [],
    })

    expect(result.current.newCount).toBe(1)
    expect(result.current.displayedPRs).toEqual([existing])
  })

  it('GIVEN badge showing THEN dismiss resets newCount and reveals full prs', async () => {
    const existing = makePR('existing')
    const newPR = makePR('new')
    const refetch = vi.fn()
    const { result, rerender } = renderHook((props: Props) => useHook(props), {
      initialProps: { ...defaults, refetch, allPRs: [existing], prs: [existing], priorityPRs: [] },
    })

    await act(async () => {
      window.dispatchEvent(new FocusEvent('focus'))
    })
    rerender({
      ...defaults,
      refetch,
      isFetching: true,
      allPRs: [existing],
      prs: [existing],
      priorityPRs: [],
    })
    rerender({
      ...defaults,
      refetch,
      isFetching: false,
      allPRs: [existing, newPR],
      prs: [existing, newPR],
      priorityPRs: [],
    })
    expect(result.current.newCount).toBe(1)

    act(() => {
      result.current.dismiss()
    })

    expect(result.current.newCount).toBe(0)
    expect(result.current.displayedPRs).toEqual([existing, newPR])
  })

  it('GIVEN focus fires and PR is removed THEN displayedPRs excludes removed PR and newCount stays 0', async () => {
    const existing1 = makePR('existing1')
    const existing2 = makePR('existing2')
    const refetch = vi.fn()
    const { result, rerender } = renderHook((props: Props) => useHook(props), {
      initialProps: {
        ...defaults,
        refetch,
        allPRs: [existing1, existing2],
        prs: [existing1, existing2],
        priorityPRs: [],
      },
    })

    await act(async () => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    rerender({
      ...defaults,
      refetch,
      isFetching: true,
      allPRs: [existing1, existing2],
      prs: [existing1, existing2],
      priorityPRs: [],
    })
    // existing2 removed from review list
    rerender({
      ...defaults,
      refetch,
      isFetching: false,
      allPRs: [existing1],
      prs: [existing1],
      priorityPRs: [],
    })

    expect(result.current.newCount).toBe(0)
    expect(result.current.displayedPRs).toEqual([existing1])
  })

  it('GIVEN focus fires and PR removed + new PR added THEN displayedPRs hides new PR but not removed, newCount is 1', async () => {
    const existing1 = makePR('existing1')
    const existing2 = makePR('existing2')
    const newPR = makePR('new')
    const refetch = vi.fn()
    const { result, rerender } = renderHook((props: Props) => useHook(props), {
      initialProps: {
        ...defaults,
        refetch,
        allPRs: [existing1, existing2],
        prs: [existing1, existing2],
        priorityPRs: [],
      },
    })

    await act(async () => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    rerender({
      ...defaults,
      refetch,
      isFetching: true,
      allPRs: [existing1, existing2],
      prs: [existing1, existing2],
      priorityPRs: [],
    })
    // existing2 gone, new PR appeared
    rerender({
      ...defaults,
      refetch,
      isFetching: false,
      allPRs: [existing1, newPR],
      prs: [existing1, newPR],
      priorityPRs: [],
    })

    expect(result.current.newCount).toBe(1)
    expect(result.current.displayedPRs).toEqual([existing1])
  })

  it('GIVEN new PR appears then disappears before dismiss THEN newCount resets to 0', async () => {
    const existing = makePR('existing')
    const newPR = makePR('new')
    const refetch = vi.fn()
    const { result, rerender } = renderHook((props: Props) => useHook(props), {
      initialProps: { ...defaults, refetch, allPRs: [existing], prs: [existing], priorityPRs: [] },
    })

    // focus: snapshot taken of [existing], newPR appears
    await act(async () => {
      window.dispatchEvent(new FocusEvent('focus'))
    })
    rerender({
      ...defaults,
      refetch,
      isFetching: true,
      allPRs: [existing],
      prs: [existing],
      priorityPRs: [],
    })
    rerender({
      ...defaults,
      refetch,
      isFetching: false,
      allPRs: [existing, newPR],
      prs: [existing, newPR],
      priorityPRs: [],
    })
    expect(result.current.newCount).toBe(1)

    // second focus: newPR is gone before dismiss
    await act(async () => {
      window.dispatchEvent(new FocusEvent('focus'))
    })
    rerender({
      ...defaults,
      refetch,
      isFetching: true,
      allPRs: [existing, newPR],
      prs: [existing, newPR],
      priorityPRs: [],
    })
    rerender({
      ...defaults,
      refetch,
      isFetching: false,
      allPRs: [existing],
      prs: [existing],
      priorityPRs: [],
    })

    expect(result.current.newCount).toBe(0)
    expect(result.current.displayedPRs).toEqual([existing])
  })

  it('GIVEN load-more completes without focus THEN newCount stays 0', async () => {
    const existing = makePR('existing')
    const paginated = makePR('paginated')
    const refetch = vi.fn()
    const { result, rerender } = renderHook((props: Props) => useHook(props), {
      initialProps: { ...defaults, refetch, allPRs: [existing], prs: [existing], priorityPRs: [] },
    })

    // load-more without a prior focus
    rerender({
      ...defaults,
      refetch,
      isFetchingNextPage: true,
      allPRs: [existing],
      prs: [existing],
      priorityPRs: [],
    })
    rerender({
      ...defaults,
      refetch,
      isFetchingNextPage: false,
      allPRs: [existing, paginated],
      prs: [existing, paginated],
      priorityPRs: [],
    })

    expect(result.current.newCount).toBe(0)
  })
})
