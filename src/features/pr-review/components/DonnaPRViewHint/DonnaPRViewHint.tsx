import { X } from 'lucide-react'

type Props = { onDismiss: () => void }

export const DonnaPRViewHint = ({ onDismiss }: Props) => (
  <div className="mb-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
    <p className="flex-1">
      Prefer github.com? You can switch this off in <strong>Settings</strong>.
    </p>
    <button
      onClick={onDismiss}
      aria-label="Dismiss"
      className="shrink-0 cursor-pointer text-[var(--color-text-secondary)] hover:text-[var(--color-text)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none rounded"
    >
      <X size={14} />
    </button>
  </div>
)
