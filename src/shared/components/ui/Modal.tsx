import { X } from 'lucide-react'
import { type PropsWithChildren, type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

type Props = PropsWithChildren & {
  isOpen: boolean
  title: string
  onClose: () => void
  className?: string
  actions?: ReactNode
}

export const Modal = ({ children, isOpen, title, onClose, className, actions }: Props) => {
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  // ponytail: portal escapes any ancestor with transform/filter that would break fixed positioning
  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-[var(--color-overlay)]"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`pointer-events-auto max-w-xl max-h-[80vh] overflow-y-auto rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-lg p-4 space-y-4 ${className ?? ''}`}
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {title}
            </p>
            <div className="flex items-center gap-3 shrink-0">
              {actions}
              <button
                onClick={onClose}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none rounded"
                aria-label={`Close ${title}`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}
