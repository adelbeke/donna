import type { ReactNode } from 'react'
import { ExternalLink, Eye, EyeOff, FileDiff, Star, Terminal } from 'lucide-react'
import { Column, Legend } from './GuideBlocks'

export type StepContent = {
  title: string
  /** GitHub search behind the section, shown verbatim so the list stops looking arbitrary. */
  query?: string
  body: ReactNode
}

const ICON_SIZE = 14

export const STEP_CONTENT: Record<string, StepContent> = {
  'list-review-requested': {
    title: 'Review requested',
    query: 'is:open review-requested:you',
    body: (
      <>
        <p>Every open PR where GitHub still has you down as a requested reviewer.</p>
        <p>
          This is a <strong>live search</strong>, not your notification inbox. Marking a
          notification as done on github.com will not empty this list — only the request being
          dismissed or re-requested changes it. That is usually why the count is higher than you
          expect.
        </p>
      </>
    ),
  },
  'list-authored': {
    title: 'My PRs',
    query: 'is:open author:you',
    body: (
      <>
        <p>Your own open pull requests, drafts included.</p>
        <p>
          Donna warns you here once you have more open than your context-switch threshold — the
          number of parallel PRs you have decided is too many. It lives in <strong>Settings</strong>
          .
        </p>
      </>
    ),
  },
  'list-reviewed': {
    title: 'Reviewed',
    query: 'is:open reviewed-by:you -author:you',
    body: (
      <>
        <p>PRs you have already reviewed that are still open — the follow-up pile.</p>
        <p>
          Somebody pushed changes after your review, or nobody merged it. This is where you check
          whether your comments actually landed.
        </p>
      </>
    ),
  },
  'star-hide': {
    title: 'Star & hide',
    body: (
      <>
        <div className="space-y-1.5">
          <Legend icon={<Star size={ICON_SIZE} />}>
            <strong>Star</strong> pins a PR to a Top priority group above the list.
          </Legend>
          <Legend icon={<EyeOff size={ICON_SIZE} />}>
            <strong>Hide</strong> dims it and drops it out of the list until you switch{' '}
            <strong>Hidden</strong> back on in the list header.
          </Legend>
          <Legend icon={<Eye size={ICON_SIZE} />}>
            Both survive restarts, and both are visible only to you.
          </Legend>
        </div>
        <p>
          They exist on <strong>Review requested</strong> only — that is the one list meant to be
          triaged down to nothing.
        </p>
      </>
    ),
  },
  'local-vs-github': {
    title: 'Local vs GitHub',
    body: (
      <>
        <div className="grid grid-cols-2 gap-2">
          <Column
            label="Stays in Donna"
            tone="text-[var(--color-success)]"
            items={[
              'Star and hide',
              'Muted authors',
              'Hidden repos',
              'Repo and title filters',
              'Drafts / Hidden toggles',
            ]}
          />
          <Column
            label="Writes to GitHub"
            tone="text-[var(--color-warning)]"
            items={[
              'Approve / request changes',
              'Posting a review comment',
              'Replying to a thread',
              'Resolving a thread',
              'Running a shortcut',
            ]}
          />
        </div>
        <p>
          Nothing on the left is visible to anyone else, and none of it touches your GitHub
          notifications. Everything on the right is a real action on github.com, made as you.
        </p>
        <div className="space-y-1.5">
          <Legend icon={<FileDiff size={ICON_SIZE} />}>
            Review in Donna opens the diff here — approving from it posts a real review.
          </Legend>
          <Legend icon={<Terminal size={ICON_SIZE} />}>
            Running a shortcut posts a comment on the PR.
          </Legend>
          <Legend icon={<ExternalLink size={ICON_SIZE} />}>
            Open on GitHub is always just a link.
          </Legend>
        </div>
      </>
    ),
  },
  triage: {
    title: 'The triage loop',
    body: (
      <>
        <ol className="space-y-1.5">
          {[
            'Open Review requested — this is the inbox.',
            'Star the one or two you will genuinely do today.',
            'Hide the rest. They come back if the author re-requests you.',
            'Mute bots like dependabot in Settings so they never appear again.',
            'Check My PRs for anything now blocked on you.',
          ].map((line, index) => (
            <li key={line} className="flex items-start gap-2">
              <span className="mt-px shrink-0 w-4 h-4 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] text-[10px] font-medium flex items-center justify-center leading-none">
                {index + 1}
              </span>
              <span className="flex-1">{line}</span>
            </li>
          ))}
        </ol>
        <p>
          Donna is a triage surface, not an archive. If the list feels endless, the fix is muting
          and hiding — not scrolling.
        </p>
      </>
    ),
  },
}

export const BRANCHES_TIP =
  'The Branches tab does the same for your local checkouts: every branch across the repos you add, with worktree and dirty-state detection.'
