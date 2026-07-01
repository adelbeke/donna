import type { PropsWithChildren } from 'react'
import { twMerge } from 'tailwind-merge'
import { ButtonWithTooltip } from '@/shared/components/ui/ButtonWithTooltip'

type Props = PropsWithChildren & {
  onClick: () => void
  title: string
  className: string
}

export const PRCardAction = ({ children, title, className, onClick }: Props) => {
  const computedClassName = twMerge(
    'p-1.5 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent] focus-visible:outline-none',
    className
  )

  return (
    <ButtonWithTooltip onClick={onClick} label={title} buttonClassName={computedClassName}>
      {children}
    </ButtonWithTooltip>
  )
}
