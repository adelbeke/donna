import type { PropsWithChildren } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = PropsWithChildren & {
  onClick: () => void
  title: string
  className: string
}

export const OPACITY_CLASSNAME = 'lg:opacity-0 md:opacity-100 lg:group-hover:opacity-100'

export function PRCardAction({ children, title, className, onClick }: Props) {
  const computedClassName = twMerge(
    'p-1.5 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent] focus-visible:outline-none',
    className,
    OPACITY_CLASSNAME
  )

  return (
    <button onClick={onClick} title={title} className={computedClassName}>
      {children}
    </button>
  )
}
