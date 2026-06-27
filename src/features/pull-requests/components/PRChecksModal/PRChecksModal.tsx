import { useRef, useEffect } from 'react'
import { Clock, ExternalLink } from 'lucide-react'
import type { CheckRunContext, StatusContextItem, CheckRollupState } from '@/types/github.ts'
import {PRCheckIcon} from "@/features/pull-requests/components/PRChecksModal/PRCheckIcon.tsx";

interface Props {
  checks: (CheckRunContext | StatusContextItem)[]
  rollupState?: CheckRollupState | null
  onClose: () => void
  isLoading?: boolean
}

export function PRChecksModal({ checks, rollupState, onClose, isLoading }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={panelRef}
      className="absolute left-0 top-full mt-1 z-50 min-w-60 max-w-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-card-hover)] py-1"
    >
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
    </div>
  )
}
