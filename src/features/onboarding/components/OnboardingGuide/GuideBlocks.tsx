import type { ReactNode } from 'react'

/** Icon + prose row, mirroring how the action it describes reads on a PR card. */
export const Legend = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <div className="flex items-start gap-2">
    <span className="mt-0.5 shrink-0 text-[var(--color-text-muted)]">{icon}</span>
    <p className="flex-1">{children}</p>
  </div>
)

export const Column = ({
  label,
  tone,
  items,
}: {
  label: string
  tone: string
  items: string[]
}) => (
  <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-2.5">
    <p className={`text-[10px] font-medium uppercase tracking-wider mb-1.5 ${tone}`}>{label}</p>
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item} className="text-[var(--color-text-secondary)]">
          {item}
        </li>
      ))}
    </ul>
  </div>
)
