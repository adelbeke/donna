import { usePRStore, type PRSection } from '../../stores/prStore'

const SECTIONS: { id: PRSection; label: string }[] = [
  { id: 'review-requested', label: 'Review requested' },
  { id: 'authored', label: 'My PRs' },
  { id: 'mentioned', label: 'Mentioned' },
]

export const PRSectionsTabs = () => {
  const section = usePRStore((s) => s.section)
  const setSection = usePRStore((s) => s.setSection)

  return (
    <aside className="w-56 shrink-0">
      <nav className="space-y-0.5">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
              ${
                section === s.id
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]'
              }`}
          >
            {s.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
