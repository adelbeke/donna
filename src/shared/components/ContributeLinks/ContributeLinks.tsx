import { Bug, Lightbulb } from 'lucide-react'
import { ChangelogButton } from '@/features/updates/exports.ts'

const LINK_CLASSES =
  'flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors'

export const ContributeLinks = () => {
  return (
    <>
      <p className="text-xs text-[var(--color-text-muted)]">Donna is open source. Make it yours.</p>
      <a
        href="https://github.com/adelbeke/donna/issues/new?template=feature_request.md"
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CLASSES}
      >
        <Lightbulb size={13} />
        Propose a feature
      </a>
      <a
        href="https://github.com/adelbeke/donna/issues/new?template=bug_report.md"
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CLASSES}
      >
        <Bug size={13} />
        Report a bug
      </a>
      <ChangelogButton />
    </>
  )
}
