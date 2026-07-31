export type PRDetailTab = 'feed' | 'review'

type Props = {
  active: PRDetailTab
  onChange: (tab: PRDetailTab) => void
}

const TABS: { id: PRDetailTab; label: string }[] = [
  { id: 'feed', label: 'Feed' },
  { id: 'review', label: 'Review' },
]

export const PRDetailTabs = ({ active, onChange }: Props) => (
  <div
    className="mb-4 flex items-center gap-1 border-b border-[var(--color-border)]"
    role="tablist"
  >
    {TABS.map((tab) => (
      <button
        key={tab.id}
        role="tab"
        aria-selected={active === tab.id}
        onClick={() => onChange(tab.id)}
        className={`px-3 py-1.5 text-sm cursor-pointer border-b-2 -mb-px transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
          ${
            active === tab.id
              ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-medium'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
)
