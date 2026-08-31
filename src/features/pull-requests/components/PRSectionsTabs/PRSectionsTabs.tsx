import { ContributeLinks } from '@/shared/components/ContributeLinks/ContributeLinks.tsx'
import { useOnboardingStore } from '@/features/onboarding/stores/onboardingStore'
import { useNotificationStore } from '@/features/notifications/exports'
import { usePRStore, type PRSection } from '../../stores/prStore'

const SECTIONS: { id: PRSection; label: string }[] = [
  { id: 'authored', label: 'My PRs' },
  { id: 'review-requested', label: 'Review requested' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'reviewed', label: 'Reviewed' },
]

export const PRSectionsTabs = () => {
  const section = usePRStore((s) => s.section)
  const setSection = usePRStore((s) => s.setSection)
  const spotlight = useOnboardingStore((s) => s.spotlight)
  const unreadSections = useNotificationStore((s) => s.unreadSections)
  const clearSectionUnread = useNotificationStore((s) => s.clearSectionUnread)

  return (
    <aside className="w-56 shrink-0">
      <nav className="space-y-0.5">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              clearSectionUnread(s.id)
              setSection(s.id)
            }}
            className={`w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
              ${
                section === s.id
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]'
              }
              ${section === s.id && spotlight === 'sections' ? 'motion-safe:animate-spotlight-ring' : ''}`}
          >
            <span className="flex items-center gap-2">
              <span>{s.label}</span>
              {s.id !== section && unreadSections.includes(s.id) && (
                <span
                  aria-label={`${s.label} has unread notifications`}
                  className="h-2 w-2 rounded-full bg-[var(--color-danger)]"
                />
              )}
            </span>
          </button>
        ))}
      </nav>
      <div className="mt-6 pt-3 border-t border-[var(--color-border)] space-y-1.5 px-3">
        <ContributeLinks />
      </div>
    </aside>
  )
}
