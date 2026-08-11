import { describe, it, expect } from 'vitest'
import type { PullRequest, Review } from '@/types/github'
import {
  classifyPR,
  FOCUS_BUCKET_ORDER,
  groupIntoBuckets,
  isAwaitingMyReply,
  isReadyToMerge,
} from './focus'

const ME = 'alice'

const makePR = (overrides: Partial<PullRequest> = {}): PullRequest => ({
  id: 'pr-1',
  number: 1,
  title: 'Test PR',
  url: 'https://github.com/org/repo/pull/1',
  isDraft: false,
  headRefName: '',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  author: { login: 'bob', avatarUrl: 'https://example.com/bob.png' },
  repository: { name: 'repo', nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
  reviewRequests: { nodes: [] },
  reviews: { nodes: [] },
  comments: { nodes: [] },
  additions: 0,
  deletions: 0,
  mergeable: 'MERGEABLE',
  commits: { nodes: [] },
  ...overrides,
})

const review = (login: string, submittedAt: string, state: Review['state'] = 'COMMENTED') => ({
  state,
  submittedAt,
  author: { login, avatarUrl: `https://example.com/${login}.png` },
})

const comment = (login: string, createdAt: string) => ({
  createdAt,
  author: { login, avatarUrl: `https://example.com/${login}.png` },
})

const rollup = (state: 'SUCCESS' | 'FAILURE' | 'PENDING') => ({
  nodes: [{ commit: { statusCheckRollup: { state } } }],
})

describe('isAwaitingMyReply', () => {
  it('GIVEN a PR I authored WHEN someone comments after I opened it THEN the ball is in my court', () => {
    const pr = makePR({
      author: { login: ME, avatarUrl: '' },
      comments: { nodes: [comment('bob', '2024-01-02T00:00:00Z')] },
    })
    expect(isAwaitingMyReply(pr, ME)).toBe(true)
  })

  it('GIVEN a PR I authored WHEN I replied after their comment THEN it is not awaiting me', () => {
    const pr = makePR({
      author: { login: ME, avatarUrl: '' },
      comments: {
        nodes: [comment('bob', '2024-01-02T00:00:00Z'), comment(ME, '2024-01-03T00:00:00Z')],
      },
    })
    expect(isAwaitingMyReply(pr, ME)).toBe(false)
  })

  it('GIVEN a PR I reviewed WHEN the author replied after my review THEN the ball is back in my court', () => {
    const pr = makePR({
      reviews: {
        nodes: [review(ME, '2024-01-02T00:00:00Z'), review('bob', '2024-01-03T00:00:00Z')],
      },
    })
    expect(isAwaitingMyReply(pr, ME)).toBe(true)
  })

  it('GIVEN a PR I never spoke on WHEN others discuss it THEN it is not my conversation', () => {
    const pr = makePR({
      comments: { nodes: [comment('bob', '2024-01-02T00:00:00Z')] },
      reviews: { nodes: [review('carol', '2024-01-03T00:00:00Z')] },
    })
    expect(isAwaitingMyReply(pr, ME)).toBe(false)
  })

  it('GIVEN my last word is a review and theirs an issue comment THEN both streams are compared together', () => {
    const pr = makePR({
      reviews: { nodes: [review(ME, '2024-01-05T00:00:00Z')] },
      comments: { nodes: [comment('bob', '2024-01-06T00:00:00Z')] },
    })
    expect(isAwaitingMyReply(pr, ME)).toBe(true)
  })

  it('GIVEN details are not loaded yet THEN it is not classified as awaiting me', () => {
    const pr = makePR({ reviews: undefined, comments: undefined })
    expect(isAwaitingMyReply(pr, ME)).toBe(false)
  })

  it('GIVEN a pending review with no submittedAt THEN it is ignored', () => {
    const pr = makePR({
      author: { login: ME, avatarUrl: '' },
      reviews: {
        nodes: [
          {
            state: 'PENDING',
            submittedAt: null as unknown as string,
            author: { login: 'bob', avatarUrl: '' },
          },
        ],
      },
    })
    expect(isAwaitingMyReply(pr, ME)).toBe(false)
  })

  it('GIVEN no viewer login THEN nothing is awaiting me', () => {
    expect(isAwaitingMyReply(makePR(), '')).toBe(false)
  })
})

describe('isReadyToMerge', () => {
  const readyPR = () =>
    makePR({
      author: { login: ME, avatarUrl: '' },
      mergeable: 'MERGEABLE',
      commits: rollup('SUCCESS'),
      reviews: { nodes: [review('bob', '2024-01-02T00:00:00Z', 'APPROVED')] },
    })

  it('GIVEN my green approved conflict-free PR THEN it is ready to merge', () => {
    expect(isReadyToMerge(readyPR(), ME)).toBe(true)
  })

  it('GIVEN a PR authored by someone else THEN it is not mine to merge', () => {
    const pr = { ...readyPR(), author: { login: 'bob', avatarUrl: '' } }
    expect(isReadyToMerge(pr, ME)).toBe(false)
  })

  it('GIVEN a draft PR THEN it is not ready', () => {
    expect(isReadyToMerge({ ...readyPR(), isDraft: true }, ME)).toBe(false)
  })

  it('GIVEN a conflicting PR THEN it is not ready', () => {
    expect(isReadyToMerge({ ...readyPR(), mergeable: 'CONFLICTING' }, ME)).toBe(false)
  })

  it('GIVEN mergeable is still UNKNOWN THEN it is not ready', () => {
    expect(isReadyToMerge({ ...readyPR(), mergeable: 'UNKNOWN' }, ME)).toBe(false)
  })

  it('GIVEN failing checks THEN it is not ready', () => {
    expect(isReadyToMerge({ ...readyPR(), commits: rollup('FAILURE') }, ME)).toBe(false)
  })

  it('GIVEN pending checks THEN it is not ready', () => {
    expect(isReadyToMerge({ ...readyPR(), commits: rollup('PENDING') }, ME)).toBe(false)
  })

  it('GIVEN a repo with no CI at all THEN checks do not block readiness', () => {
    expect(isReadyToMerge({ ...readyPR(), commits: { nodes: [] } }, ME)).toBe(true)
  })

  it('GIVEN no approval THEN it is not ready', () => {
    expect(isReadyToMerge({ ...readyPR(), reviews: { nodes: [] } }, ME)).toBe(false)
  })

  it('GIVEN an outstanding changes-requested THEN it is not ready', () => {
    const pr = {
      ...readyPR(),
      reviews: {
        nodes: [
          review('bob', '2024-01-02T00:00:00Z', 'APPROVED'),
          review('carol', '2024-01-03T00:00:00Z', 'CHANGES_REQUESTED'),
        ],
      },
    }
    expect(isReadyToMerge(pr, ME)).toBe(false)
  })

  it('GIVEN a reviewer who requested changes then approved THEN only their latest state counts', () => {
    const pr = {
      ...readyPR(),
      reviews: {
        nodes: [
          review('bob', '2024-01-02T00:00:00Z', 'CHANGES_REQUESTED'),
          review('bob', '2024-01-03T00:00:00Z', 'APPROVED'),
        ],
      },
    }
    expect(isReadyToMerge(pr, ME)).toBe(true)
  })
})

describe('classifyPR', () => {
  it('GIVEN a review-requested PR I have not reviewed THEN it lands in to-review', () => {
    expect(classifyPR(makePR(), ME, true)).toBe('to-review')
  })

  it('GIVEN a review-requested PR I already reviewed THEN it is not in to-review', () => {
    const pr = makePR({ reviews: { nodes: [review(ME, '2024-01-02T00:00:00Z', 'APPROVED')] } })
    expect(classifyPR(pr, ME, true)).toBe(null)
  })

  it('GIVEN a draft review-requested PR THEN it is not in to-review', () => {
    expect(classifyPR(makePR({ isDraft: true }), ME, true)).toBe(null)
  })

  it('GIVEN a PR that is both ready to merge and awaiting my reply THEN ready to merge wins', () => {
    const pr = makePR({
      author: { login: ME, avatarUrl: '' },
      mergeable: 'MERGEABLE',
      commits: rollup('SUCCESS'),
      reviews: { nodes: [review('bob', '2024-01-02T00:00:00Z', 'APPROVED')] },
      comments: { nodes: [comment('bob', '2024-01-04T00:00:00Z')] },
    })
    expect(classifyPR(pr, ME, false)).toBe('ready-to-merge')
  })

  it('GIVEN a PR matching nothing THEN it is unclassified', () => {
    expect(classifyPR(makePR(), ME, false)).toBe(null)
  })
})

describe('groupIntoBuckets', () => {
  it('GIVEN mixed PRs THEN each lands in exactly one bucket', () => {
    const toReview = makePR({ id: 'to-review' })
    const ready = makePR({
      id: 'ready',
      author: { login: ME, avatarUrl: '' },
      commits: rollup('SUCCESS'),
      reviews: { nodes: [review('bob', '2024-01-02T00:00:00Z', 'APPROVED')] },
    })
    const awaiting = makePR({
      id: 'awaiting',
      author: { login: ME, avatarUrl: '' },
      comments: { nodes: [comment('bob', '2024-01-02T00:00:00Z')] },
    })

    const actual = groupIntoBuckets([toReview, ready, awaiting], ME, new Set(['to-review']), [])

    expect(actual['to-review'].map((p) => p.id)).toEqual(['to-review'])
    expect(actual['ready-to-merge'].map((p) => p.id)).toEqual(['ready'])
    expect(actual['awaiting-my-reply'].map((p) => p.id)).toEqual(['awaiting'])
  })

  it('GIVEN several PRs in a bucket THEN starred ones are pinned and the rest sort by updatedAt desc', () => {
    const old = makePR({ id: 'old', updatedAt: '2024-01-01T00:00:00Z' })
    const recent = makePR({ id: 'recent', updatedAt: '2024-03-01T00:00:00Z' })
    const starred = makePR({ id: 'starred', updatedAt: '2024-02-01T00:00:00Z' })

    const actual = groupIntoBuckets(
      [old, recent, starred],
      ME,
      new Set(['old', 'recent', 'starred']),
      ['starred']
    )

    expect(actual['to-review'].map((p) => p.id)).toEqual(['starred', 'recent', 'old'])
  })

  it('GIVEN unclassified PRs THEN they are dropped entirely', () => {
    const actual = groupIntoBuckets([makePR({ id: 'noise' })], ME, new Set(), [])
    expect(FOCUS_BUCKET_ORDER.flatMap((b) => actual[b])).toEqual([])
  })

  it('GIVEN the bucket order THEN it is cheapest-to-clear first', () => {
    expect(FOCUS_BUCKET_ORDER).toEqual(['ready-to-merge', 'to-review', 'awaiting-my-reply'])
  })
})
