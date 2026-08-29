import { useNotificationStore } from '../../stores/notificationStore'

const CATEGORY_LABELS: Record<'review-requested' | 'assigned', string> = {
  'review-requested': 'New review requests',
  assigned: 'New PRs assigned to me',
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]

const INTERVAL_OPTIONS: { label: string; value: number }[] = [
  { label: '1 minute', value: 60_000 },
  { label: '5 minutes', value: 5 * 60_000 },
  { label: '15 minutes', value: 15 * 60_000 },
  { label: '30 minutes', value: 30 * 60_000 },
]

export const SettingsPage = () => {
  const enabledCategories = useNotificationStore((s) => s.enabledCategories)
  const toggleCategory = useNotificationStore((s) => s.toggleCategory)
  const pollIntervalMs = useNotificationStore((s) => s.pollIntervalMs)
  const setPollIntervalMs = useNotificationStore((s) => s.setPollIntervalMs)

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Settings</h2>

      <section>
        <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          Notifications
        </h3>

        <div className="space-y-2">
          {CATEGORIES.map((category) => (
            <label key={category} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledCategories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="accent-[var(--color-accent)] cursor-pointer"
              />
              <span className="text-xs text-[var(--color-text-primary)]">
                {CATEGORY_LABELS[category]}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label
            htmlFor="poll-interval"
            className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2"
          >
            Check for new PRs every
          </label>
          <select
            id="poll-interval"
            value={pollIntervalMs}
            onChange={(e) => setPollIntervalMs(Number(e.target.value))}
            className="text-xs px-2 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer"
          >
            {INTERVAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </section>
    </div>
  )
}
