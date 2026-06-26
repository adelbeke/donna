import { Check, AlertCircle, MessageSquare, Clock } from 'lucide-react'
import type { PullRequest } from '@/types/github'
import { deriveReviewerSummary } from '../../lib/prUtils'
import type { Reviewer } from '../../lib/prUtils'

interface Props {
  pr: PullRequest
  authorLogin: string
}

type Kind = 'approved' | 'changesRequested' | 'commented' | 'pending'

const groupConfig: Record<Kind, { icon: React.ReactElement; color: string }> = {
  approved: { icon: <Check size={11} />, color: 'text-[var(--color-success)]' },
  changesRequested: { icon: <AlertCircle size={11} />, color: 'text-[var(--color-danger)]' },
  commented: { icon: <MessageSquare size={11} />, color: 'text-[var(--color-accent)]' },
  pending: { icon: <Clock size={11} />, color: 'text-[var(--color-text-muted)]' },
}

const ORDER: Kind[] = ['approved', 'changesRequested', 'commented', 'pending']

export function ReviewerAvatars({ pr, authorLogin }: Props) {
  const summary = deriveReviewerSummary(pr, authorLogin)

  const groups: { kind: Kind; reviewers: Reviewer[] }[] = ORDER.map((kind) => ({
    kind,
    reviewers: summary[kind],
  })).filter((g) => g.reviewers.length > 0)

  if (groups.length === 0) return null

  return (
    <div className="flex items-center gap-3">
      {groups.map(({ kind, reviewers }) => {
        const { icon, color } = groupConfig[kind]
        return (
          <div key={kind} className="flex items-center gap-1">
            <span className={color}>{icon}</span>
            {reviewers.map(({ login, avatarUrl }) => (
              <img
                key={login}
                src={avatarUrl}
                alt={login}
                title={login}
                className="w-5 h-5 rounded-full"
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
