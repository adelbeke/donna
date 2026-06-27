import { Clock, ExternalLink } from 'lucide-react'
import type { CheckRunContext, StatusContextItem, CheckRollupState } from '@/types/github.ts'
import {PRCheckIcon} from "@/features/pull-requests/components/PRChecksModal/PRCheckIcon.tsx";
import {Modal} from "@/shared/components/ui/Modal.tsx";

interface Props {
  isOpen: boolean
  prTitle: string
  checks: (CheckRunContext | StatusContextItem)[]
  rollupState?: CheckRollupState | null
  onClose: () => void
  isLoading?: boolean
}

export function PRChecksModal({ isOpen, prTitle, checks, rollupState, onClose, isLoading }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${prTitle}'s checks`}>
      {isLoading ? (
        <p className="px-3 py-2 text-xs text-[var(--color-text-muted)]">Loading…</p>
      ) : checks.length === 0 ? (
        <p className="px-3 py-2 text-xs text-[var(--color-text-muted)]">No checks found</p>
      ) : (
        checks.map((check, i) => {
          const name = check.__typename === 'CheckRun' ? check.name : check.context
          const url = check.__typename === 'CheckRun' ? check.detailsUrl : check.targetUrl
          return (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--color-surface-overlay)]"
            >
              <PRCheckIcon check={check} />
              <span className="text-xs text-[var(--color-text-secondary)] flex-1 truncate">
                {name}
              </span>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                >
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          )
        })
      )}
      {(rollupState === 'PENDING' || rollupState === 'EXPECTED') && (
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
