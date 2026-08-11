import { describe, it, expect } from 'vitest'
import {
  CHAPTERS,
  STEPS,
  chapterOfStep,
  clampStepIndex,
  firstStepIndexOfChapter,
  isLastStep,
  stepIndicesOfChapter,
} from './steps'

describe('onboarding steps — chapter model', () => {
  it('given the chapter list, then it covers the four topics from issue #112 in reading order', () => {
    const actual = CHAPTERS.map((c) => c.id)
    const expected = ['lists', 'star-hide', 'local-vs-github', 'triage']
    expect(actual).toEqual(expected)
  })

  it('given every step, then its chapter exists in CHAPTERS', () => {
    const chapterIds = new Set(CHAPTERS.map((c) => c.id))
    expect(STEPS.every((s) => chapterIds.has(s.chapter))).toBe(true)
  })

  it('given every chapter, then at least one step belongs to it', () => {
    const covered = new Set(STEPS.map((s) => s.chapter))
    expect(CHAPTERS.every((c) => covered.has(c.id))).toBe(true)
  })

  it('given the "lists" chapter, then it walks the three real PR sections in tab order', () => {
    const actual = STEPS.filter((s) => s.chapter === 'lists').map((s) => s.section)
    const expected = ['review-requested', 'authored', 'reviewed']
    expect(actual).toEqual(expected)
  })

  it('given the star-hide step, then it activates review-requested — the only section with those actions', () => {
    const actual = STEPS.find((s) => s.chapter === 'star-hide')
    expect(actual?.section).toBe('review-requested')
    expect(actual?.spotlight).toBe('card-actions')
  })

  it('given step ids, then they are unique', () => {
    const ids = STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('onboarding steps — navigation helpers', () => {
  it('given an index below zero, when clamped, then it returns the first step', () => {
    expect(clampStepIndex(-3)).toBe(0)
  })

  it('given an index past the end, when clamped, then it returns the last step', () => {
    expect(clampStepIndex(STEPS.length + 5)).toBe(STEPS.length - 1)
  })

  it('given an in-range index, when clamped, then it is unchanged', () => {
    expect(clampStepIndex(2)).toBe(2)
  })

  it('given a chapter id, then firstStepIndexOfChapter points at its first step', () => {
    const actual = firstStepIndexOfChapter('star-hide')
    expect(STEPS[actual].chapter).toBe('star-hide')
    expect(STEPS[actual - 1].chapter).not.toBe('star-hide')
  })

  it('given a step index, then chapterOfStep reports the owning chapter', () => {
    expect(chapterOfStep(0)).toBe('lists')
    expect(chapterOfStep(STEPS.length - 1)).toBe('triage')
  })

  it('given an out-of-range index, then chapterOfStep clamps instead of throwing', () => {
    expect(chapterOfStep(999)).toBe('triage')
  })

  it('given the final index, then isLastStep is true', () => {
    expect(isLastStep(STEPS.length - 1)).toBe(true)
    expect(isLastStep(0)).toBe(false)
  })

  it('given a multi-step chapter, then stepIndicesOfChapter lists each of its step indices', () => {
    expect(stepIndicesOfChapter('lists')).toEqual([0, 1, 2])
  })

  it('given a single-step chapter, then stepIndicesOfChapter returns one index', () => {
    expect(stepIndicesOfChapter('local-vs-github')).toHaveLength(1)
  })
})
