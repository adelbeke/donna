import { useState, type ReactElement } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import type { CheckRollupState } from '@/types/github'
import { PRChecksModal } from '../PRChecksModal/PRChecksModal.tsx'
import { useCheckContexts } from '../../queries/useCheckContexts'

type Props = {
  prId: string
  prTitle: string
  rollupState: CheckRollupState | null
}

const ciStateBadge: Record<
  CheckRollupState,
  { label: string; color: string; bg: string; icon: ReactElement }
> = {
  SUCCESS: {
    label: 'Checks pass',
    color: 'text-[var(--color-success)]',
    bg: 'bg-[var(--color-success-subtle)]',
    icon: <CheckCircle size={11} />,
  },
  FAILURE: {
    label: 'Checks failed',
    color: 'text-[var(--color-danger)]',
    bg: 'bg-[var(--color-danger-subtle)]',
    icon: <XCircle size={11} />,
  },
  ERROR: {
    label: 'Checks error',
    color: 'text-[var(--color-danger)]',
    bg: 'bg-[var(--color-danger-subtle)]',
    icon: <XCircle size={11} />,
  },
  PENDING: {
    label: 'Checks pending',
    color: 'text-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning-subtle)]',
    icon: <Clock size={11} />,
  },
  EXPECTED: {
    label: 'Checks pending',
    color: 'text-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning-subtle)]',
    icon: <Clock size={11} />,
  },
}

export const PRChecksBadge = ({ prId, prTitle, rollupState }: Props) => {
  const [checksOpen, setChecksOpen] = useState(false)
  const {
    checks,
    isLoading: checksLoading,
    isRefetching: checksRefetching,
    refetch: refetchChecks,
  } = useCheckContexts(prId, checksOpen)

  if (!rollupState) return null
  const ciBadge = ciStateBadge[rollupState]

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setChecksOpen((o) => !o)}
        className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded cursor-pointer ${ciBadge.color} ${ciBadge.bg}`}
      >
        {ciBadge.icon}
        {ciBadge.label}
      </button>
      <PRChecksModal
        isOpen={checksOpen}
        prTitle={prTitle}
        checks={checks}
        isLoading={checksLoading}
        isRefreshing={checksRefetching}
        rollupState={rollupState}
        onClose={() => setChecksOpen(false)}
        onRefresh={refetchChecks}
      />
    </div>
  )
}
