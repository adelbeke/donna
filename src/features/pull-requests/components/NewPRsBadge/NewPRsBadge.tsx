type Props = { count: number; onDismiss: () => void }

export const NewPRsBadge = ({ count, onDismiss }: Props) => (
  <button
    onClick={onDismiss}
    className="mb-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-accent-subtle)] border border-[var(--color-accent)] text-[var(--color-accent)] text-xs cursor-pointer hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
  >
    <strong>{count} new pull request{count > 1 ? 's' : ''}</strong>
  </button>
)
