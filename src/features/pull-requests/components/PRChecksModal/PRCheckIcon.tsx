import type { CheckRunContext, StatusContextItem } from '@/types/github.ts'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

export const PRCheckIcon = ({ check }: { check: CheckRunContext | StatusContextItem }) => {
  if (check.__typename === 'CheckRun') {
    const { status, conclusion } = check
    if (
      conclusion === 'SUCCESS' ||
      (status === 'COMPLETED' && (conclusion === 'NEUTRAL' || conclusion === 'SKIPPED'))
    ) {
      return <CheckCircle size={12} className="text-[var(--color-success)] shrink-0" />
    }
    if (
      conclusion === 'FAILURE' ||
      conclusion === 'TIMED_OUT' ||
      conclusion === 'STARTUP_FAILURE' ||
      conclusion === 'CANCELLED' ||
      conclusion === 'ACTION_REQUIRED'
    ) {
      return <XCircle size={12} className="text-[var(--color-danger)] shrink-0" />
    }
    return <Clock size={12} className="text-[var(--color-warning)] shrink-0" />
  }

  const { state } = check
  if (state === 'SUCCESS')
    return <CheckCircle size={12} className="text-[var(--color-success)] shrink-0" />
  if (state === 'ERROR' || state === 'FAILURE')
    return <XCircle size={12} className="text-[var(--color-danger)] shrink-0" />
  return <Clock size={12} className="text-[var(--color-warning)] shrink-0" />
}
