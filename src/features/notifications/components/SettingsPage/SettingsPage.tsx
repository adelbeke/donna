import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useNotificationStore } from '../../stores/notificationStore'
import { SYSTEM_SOUNDS } from '../../lib/sounds'

const INTERVAL_OPTIONS: { label: string; value: number }[] = [
  { label: '1 minute', value: 60_000 },
  { label: '5 minutes', value: 5 * 60_000 },
  { label: '15 minutes', value: 15 * 60_000 },
  { label: '30 minutes', value: 30 * 60_000 },
]

const Checkbox = ({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="accent-[var(--color-accent)] cursor-pointer"
    />
    <span className="text-xs text-[var(--color-text-primary)]">{label}</span>
  </label>
)

export const SettingsPage = () => {
  const navigate = useNavigate()
  const enabledCategories = useNotificationStore((s) => s.enabledCategories)
  const toggleCategory = useNotificationStore((s) => s.toggleCategory)
  const checksEnabled = useNotificationStore((s) => s.checksEnabled)
  const toggleChecksEnabled = useNotificationStore((s) => s.toggleChecksEnabled)
  const reviewLeftEnabled = useNotificationStore((s) => s.reviewLeftEnabled)
  const toggleReviewLeftEnabled = useNotificationStore((s) => s.toggleReviewLeftEnabled)
  const pollIntervalMs = useNotificationStore((s) => s.pollIntervalMs)
  const setPollIntervalMs = useNotificationStore((s) => s.setPollIntervalMs)
  const soundName = useNotificationStore((s) => s.soundName)
  const setSoundName = useNotificationStore((s) => s.setSoundName)
  const silent = useNotificationStore((s) => s.silent)
  const toggleSilent = useNotificationStore((s) => s.toggleSilent)

  const isCustomSound =
    soundName !== null && !(SYSTEM_SOUNDS as readonly string[]).includes(soundName)

  const handlePickSound = async () => {
    const fileName = await window.electronAPI?.notifications.pickSound()
    if (fileName) setSoundName(fileName)
  }

  return (
    <div className="max-w-lg space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none rounded"
      >
        <ArrowLeft size={13} />
        Back
      </button>

      <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Settings</h2>

      <section>
        <h3 className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Notifications
          <span className="normal-case tracking-normal text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
            Beta
          </span>
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Notifications are new and still settling in — found a bug or have feedback?{' '}
          <a
            href="https://github.com/adelbeke/donna/issues/new?template=bug_report.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:underline"
          >
            Let me know
          </a>
          .
        </p>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">
              Review requested
            </p>
            <Checkbox
              label="Notify me on new review requests"
              checked={enabledCategories.includes('review-requested')}
              onChange={() => toggleCategory('review-requested')}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Assigned to me</p>
            <Checkbox
              label="Notify me when assigned"
              checked={enabledCategories.includes('assigned')}
              onChange={() => toggleCategory('assigned')}
            />
            <Checkbox
              label="Notify me when CI passes or fails"
              checked={checksEnabled.assigned}
              onChange={() => toggleChecksEnabled('assigned')}
            />
            <Checkbox
              label="Notify me when someone reviews"
              checked={reviewLeftEnabled.assigned}
              onChange={() => toggleReviewLeftEnabled('assigned')}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">
              My pull requests
            </p>
            <Checkbox
              label="Notify me when CI passes or fails"
              checked={checksEnabled.authored}
              onChange={() => toggleChecksEnabled('authored')}
            />
            <Checkbox
              label="Notify me when someone reviews my PR"
              checked={reviewLeftEnabled.authored}
              onChange={() => toggleReviewLeftEnabled('authored')}
            />
          </div>
        </div>

        <div className="mt-5">
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

        <div className="mt-5 space-y-2">
          <label
            htmlFor="notification-sound"
            className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2"
          >
            Notification sound
          </label>
          <div className="flex items-center gap-2">
            <select
              id="notification-sound"
              value={soundName ?? ''}
              disabled={silent}
              onChange={(e) => setSoundName(e.target.value)}
              className="text-xs px-2 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCustomSound && <option value={soundName ?? ''}>{soundName} (custom)</option>}
              {SYSTEM_SOUNDS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handlePickSound}
              disabled={silent}
              className="text-xs px-2 py-1.5 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Choose local file…
            </button>
            <button
              type="button"
              onClick={() => void window.electronAPI?.notifications.test()}
              className="text-xs px-2 py-1.5 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer"
            >
              Test
            </button>
          </div>
          <Checkbox label="Silent (no sound)" checked={silent} onChange={toggleSilent} />
        </div>
      </section>
    </div>
  )
}
