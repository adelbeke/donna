type Props = { count: number; threshold: number }

export const ContextSwitchWarningBanner = ({ count, threshold }: Props) => (
  <div className="mb-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-warning-subtle)] border border-[var(--color-warning)] text-[var(--color-warning)] text-xs">
    <strong>
      {count} open PRs — heavy context-switching risk (warning threshold: {threshold})
    </strong>
  </div>
)
