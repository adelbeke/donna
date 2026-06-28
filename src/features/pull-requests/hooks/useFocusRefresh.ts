import { useState, useEffect, useRef, useCallback } from 'react'
import type { PullRequest } from '@/types/github'
import type { GlobalFilters, PRSection, ViewFilters } from '../stores/prStore'
import { applyFilters } from '../lib/prFilters'

type FocusRefreshArgs = {
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

export const useFocusRefresh = ({
  allPRs,
  prs,
  priorityPRs,
  refetch,
  isFetching,
  isFetchingNextPage,
  globalFilters,
  view,
  section,
}: FocusRefreshArgs): {
  displayedPRs: PullRequest[]
  displayedPriorityPRs: PullRequest[]
  newCount: number
  dismiss: () => void
} => {
  const [displayedPRs, setDisplayedPRs] = useState(prs)
  const [displayedPriorityPRs, setDisplayedPriorityPRs] = useState(priorityPRs)
  const [newCount, setNewCount] = useState(0)
  const [detecting, setDetecting] = useState(false)
  const snapshotIds = useRef<Set<string> | null>(null)
  const allPRsRef = useRef(allPRs)
  const sectionRef = useRef(section)
  const globalFiltersRef = useRef(globalFilters)
  const viewFiltersRef = useRef(view)
  const isFetchingRef = useRef(isFetching)
  const isFetchingNextPageRef = useRef(isFetchingNextPage)

  // Sync volatile refs without triggering display-state effects
  useEffect(() => {
    allPRsRef.current = allPRs
    globalFiltersRef.current = globalFilters
    viewFiltersRef.current = view
    isFetchingRef.current = isFetching
    isFetchingNextPageRef.current = isFetchingNextPage
  }, [allPRs, globalFilters, view, isFetching, isFetchingNextPage])

  // Display sync: keeps displayedPRs in step with prs changes.
  // While detecting, filters by snapshot so new-from-GitHub PRs stay hidden; local mutations (star/hide) pass through.
  useEffect(() => {
    if (detecting) {
      if (sectionRef.current !== section) {
        snapshotIds.current = null
        setDetecting(false)
        setNewCount(0)
      } else {
        setDisplayedPRs(prs.filter((pr) => snapshotIds.current!.has(pr.id)))
        setDisplayedPriorityPRs(priorityPRs.filter((pr) => snapshotIds.current!.has(pr.id)))
      }
    } else {
      setDisplayedPRs(prs)
      setDisplayedPriorityPRs(priorityPRs)
    }
    sectionRef.current = section
  }, [prs, priorityPRs, section, detecting])

  // Recalculates newCount when filters change mid-detection so the badge stays accurate
  useEffect(() => {
    if (snapshotIds.current === null) return
    const newPRs = allPRsRef.current.filter((pr) => !snapshotIds.current!.has(pr.id))
    const count = applyFilters(newPRs, globalFilters, view, section).length
    if (count > 0) setNewCount(count)
    else {
      snapshotIds.current = null
      setDetecting(false) // triggers display sync with current prs
      setNewCount(0)
    }
    // ponytail: allPRsRef used intentionally — allPRs excluded from deps so this only fires on filter/section changes, not fetches
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilters, view, section])

  // Post-fetch detection: fires when focus-triggered refetch + auto-pagination settle
  useEffect(() => {
    if (isFetching || isFetchingNextPage || snapshotIds.current === null) return
    const newPRs = allPRsRef.current.filter((pr) => !snapshotIds.current!.has(pr.id))
    const count = applyFilters(
      newPRs,
      globalFiltersRef.current,
      viewFiltersRef.current,
      sectionRef.current
    ).length
    if (count > 0) setNewCount(count)
    else {
      snapshotIds.current = null
      setDetecting(false) // triggers display sync with current prs
      setNewCount(0)
    }
    // ponytail: refs used intentionally — prs/priorityPRs excluded; display sync fires via detecting state change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetching, isFetchingNextPage])

  // Focus handler: snapshots current PR ids before triggering a refetch
  useEffect(() => {
    const onFocus = () => {
      // don't snapshot during an in-flight fetch; stale/empty allPRs would produce a wrong baseline
      if (
        isFetchingRef.current ||
        isFetchingNextPageRef.current ||
        sectionRef.current === 'authored'
      ) {
        refetch()
        return
      }
      if (snapshotIds.current === null) {
        snapshotIds.current = new Set(allPRsRef.current.map((pr) => pr.id))
        setDetecting(true)
      }
      refetch()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
    // ponytail: refetch excluded (stable TanStack ref); all mutable values read via refs to avoid stale closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dismiss = useCallback(() => {
    snapshotIds.current = null
    setDetecting(false)
    setNewCount(0)
  }, [])

  return { displayedPRs, displayedPriorityPRs, newCount, dismiss }
}
