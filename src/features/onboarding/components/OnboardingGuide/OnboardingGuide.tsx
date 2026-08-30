import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Compass } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal'
import { usePRStore } from '@/features/pull-requests/stores/prStore'
import { useFeatures } from '@/shared/features'
import { useOnboardingStore } from '../../stores/onboardingStore'
import {
  CHAPTERS,
  STEPS,
  chapterOfStep,
  clampStepIndex,
  firstStepIndexOfChapter,
  isLastStep,
  type ChapterId,
} from '../../lib/steps'
import { BRANCHES_TIP, STEP_CONTENT } from './guideContent'

const GUIDE_TITLE = 'How Donna works'
const PR_LIST_PATH = '/prs'

export const OnboardingGuide = () => {
  const markSeen = useOnboardingStore((s) => s.markSeen)
  const setSpotlight = useOnboardingStore((s) => s.setSpotlight)
  const setSection = usePRStore((s) => s.setSection)
  const features = useFeatures()
  const navigate = useNavigate()
  const location = useLocation()

  // ponytail: lazily seeded from the persisted flag so the first launch opens on the very first
  // render — an effect would set state after paint and flash the empty dashboard first.
  const [isOpen, setIsOpen] = useState(() => !useOnboardingStore.getState().hasSeenGuide)
  const [stepIndex, setStepIndex] = useState(0)
  // The section the reader was on before the guide started driving the tabs, restored on close.
  const sectionBeforeGuide = useRef(usePRStore.getState().section)

  const step = STEPS[stepIndex]
  const content = STEP_CONTENT[step.id]
  const activeChapter = chapterOfStep(stepIndex)
  const onLastStep = isLastStep(stepIndex)

  const open = () => {
    sectionBeforeGuide.current = usePRStore.getState().section
    setStepIndex(0)
    setIsOpen(true)
  }

  const close = useCallback(() => {
    setIsOpen(false)
    setSpotlight(null)
    setSection(sectionBeforeGuide.current)
    markSeen()
  }, [markSeen, setSection, setSpotlight])

  const goTo = useCallback((index: number) => setStepIndex(clampStepIndex(index)), [])
  const goToChapter = (chapter: ChapterId) => goTo(firstStepIndexOfChapter(chapter))

  // Drive the app behind the overlay: activate the section this step is about, and light up the
  // control it describes.
  useEffect(() => {
    if (!isOpen) return
    if (step.section) setSection(step.section)
    setSpotlight(step.spotlight ?? null)
  }, [isOpen, step, setSection, setSpotlight])

  // The guide narrates the PR list, so make sure it is what's behind the overlay.
  useEffect(() => {
    if (!isOpen || location.pathname === PR_LIST_PATH) return
    void navigate(PR_LIST_PATH)
  }, [isOpen, location.pathname, navigate])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(stepIndex + 1)
      if (e.key === 'ArrowLeft') goTo(stepIndex - 1)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, stepIndex, goTo])

  return (
    <>
      <button
        onClick={open}
        aria-label={GUIDE_TITLE}
        title={GUIDE_TITLE}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
      >
        <Compass size={13} />
        Guide
      </button>

      <Modal isOpen={isOpen} title={GUIDE_TITLE} onClose={close} transition className="min-w-1/2">
        <div className="flex gap-4">
          <nav className="w-36 shrink-0 space-y-0.5" aria-label="Guide chapters">
            {CHAPTERS.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => goToChapter(chapter.id)}
                aria-current={activeChapter === chapter.id}
                className={`w-full text-left text-xs px-2 py-1.5 rounded-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
                  ${
                    activeChapter === chapter.id
                      ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]'
                  }`}
              >
                {chapter.label}
              </button>
            ))}
          </nav>

          <div
            key={step.id}
            className="flex-1 min-w-0 space-y-2 text-xs leading-relaxed text-[var(--color-text-secondary)] motion-safe:animate-step-in [&_strong]:font-medium [&_strong]:text-[var(--color-text-primary)]"
          >
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {content.title}
            </p>
            {content.query && (
              <p className="font-mono text-[11px] px-2 py-1 rounded bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)] break-all">
                {content.query}
              </p>
            )}
            {content.body}
            {onLastStep && features.has('branches') && (
              <p className="pt-1 border-t border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
                {BRANCHES_TIP}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-1.5" aria-hidden>
            {STEPS.map((s, index) => (
              <span
                key={s.id}
                className={`h-1 rounded-full transition-all duration-200 ${
                  index === stepIndex
                    ? 'w-4 bg-[var(--color-accent)]'
                    : 'w-1 bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(stepIndex - 1)}
              disabled={stepIndex === 0}
              className="text-xs px-2.5 py-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
            >
              Back
            </button>
            <button
              autoFocus
              onClick={() => (onLastStep ? close() : goTo(stepIndex + 1))}
              className="text-xs px-3 py-1.5 rounded-md bg-[var(--color-accent)] text-white font-medium cursor-pointer hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
            >
              {onLastStep ? 'Start triaging' : 'Next'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
