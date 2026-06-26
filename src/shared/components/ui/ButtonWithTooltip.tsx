import type { PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  label: string
  onClick: () => void
  tooltipClassName?: string
  buttonClassName?: string
}

export function ButtonWithTooltip({
  children,
  label,
  tooltipClassName,
  onClick,
  buttonClassName,
}: Props) {
  return (
    <div className="relative group/tooltip">
      <button
        onClick={onClick}
        className={
          buttonClassName ??
          'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer'
        }
      >
        {children}
      </button>
      <span
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs rounded bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] whitespace-nowrap pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity ${tooltipClassName}`}
      >
        {label}
      </span>
    </div>
  )
}
