import { Clock } from 'lucide-react'
import type { CheckRunContext, StatusContextItem, CheckRollupState } from '@/types/github.ts'
import { Modal } from '@/shared/components/ui/Modal.tsx'
import { PRCheckRow } from '@/features/pull-requests/components/PRCheckRow/PRCheckRow.tsx'

type Props = {
  isOpen: boolean
  prTitle: string
  checks: (CheckRunContext | StatusContextItem)[]
  rollupState?: CheckRollupState | null
  onClose: () => void
  isLoading?: boolean
}

export const PRChecksModal = ({
  isOpen,
  prTitle,
  checks,
  rollupState,
  onClose,
  isLoading,
}: Props) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${prTitle}'s checks`}>
      {isLoading ? (
        [0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5">
            <div className="w-3 h-3 rounded-full bg-[var(--color-surface-overlay)] animate-pulse shrink-0" />
            <div className="h-3 flex-1 rounded bg-[var(--color-surface-overlay)] animate-pulse" />
          </div>
        ))
      ) : checks.length === 0 ? (
        <p className="px-3 py-2 text-xs text-[var(--color-text-muted)]">No checks found</p>
      ) : (
        checks.map((check, i) => {
          return <PRCheckRow check={check} key={i} />
        })
      )}
      {!isLoading && (rollupState === 'PENDING' || rollupState === 'EXPECTED') && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-[var(--color-border)]">
          <Clock size={12} className="text-[var(--color-warning)] shrink-0" />
          <span className="text-xs text-[var(--color-text-muted)]">
            Some checks may still be pending or not yet shown
          </span>
        </div>
      )}
    </Modal>
  )
}
