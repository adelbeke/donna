import type { PRSection } from '@/features/pull-requests/stores/prStore'

export type ChapterId = 'lists' | 'star-hide' | 'local-vs-github' | 'triage'

/** UI the guide points at while a step is on screen. */
export type SpotlightTarget = 'sections' | 'card-actions'

export type Chapter = { id: ChapterId; label: string }

export type GuideStep = {
  id: string
  chapter: ChapterId
  /**
   * Section tab activated behind the overlay while this step reads. Omitted means "leave the
   * app as the reader left it" — used by steps that talk about Donna as a whole.
   */
  section?: PRSection
  spotlight?: SpotlightTarget
}

export const CHAPTERS: Chapter[] = [
  { id: 'lists', label: 'The three lists' },
  { id: 'star-hide', label: 'Star & hide' },
  { id: 'local-vs-github', label: 'Local vs GitHub' },
  { id: 'triage', label: 'The triage loop' },
]

// ponytail: the `lists` chapter is three steps rather than one so paging through it drives the
// real section tabs behind the overlay — the reader sees the list they're reading about.
export const STEPS: GuideStep[] = [
  {
    id: 'list-review-requested',
    chapter: 'lists',
    section: 'review-requested',
    spotlight: 'sections',
  },
  { id: 'list-authored', chapter: 'lists', section: 'authored', spotlight: 'sections' },
  { id: 'list-reviewed', chapter: 'lists', section: 'reviewed', spotlight: 'sections' },
  { id: 'star-hide', chapter: 'star-hide', section: 'review-requested', spotlight: 'card-actions' },
  { id: 'local-vs-github', chapter: 'local-vs-github' },
  { id: 'triage', chapter: 'triage', section: 'review-requested' },
]

export const clampStepIndex = (index: number): number =>
  Math.min(Math.max(index, 0), STEPS.length - 1)

export const chapterOfStep = (index: number): ChapterId => STEPS[clampStepIndex(index)].chapter

export const firstStepIndexOfChapter = (chapter: ChapterId): number =>
  STEPS.findIndex((s) => s.chapter === chapter)

export const stepIndicesOfChapter = (chapter: ChapterId): number[] =>
  STEPS.reduce<number[]>((acc, step, index) => {
    if (step.chapter === chapter) acc.push(index)
    return acc
  }, [])

export const isLastStep = (index: number): boolean => index === STEPS.length - 1
