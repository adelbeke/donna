import { useState } from 'react'
import { X } from 'lucide-react'

const DISCUSSION_URL = 'https://github.com/adelbeke/donna/discussions/264'
const DISMISSED_KEY = 'maintenance-banner-dismissed'

export const MaintenanceBanner = () => {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === 'true')

  if (dismissed) return null
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2 text-xs bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border-b border-[var(--color-border)]">
      <span>
        With the rise of new tools and the latest GitHub updates, I wonder if Donna is still useful.
        If you still use it,{' '}
        <a
          href={DISCUSSION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          let me know
        </a>
        : Donna will keep minimal maintenance. Otherwise, the project will be archived.
      </span>
      <button
        onClick={() => {
          localStorage.setItem(DISMISSED_KEY, 'true')
          setDismissed(true)
        }}
        title="Dismiss"
        className="shrink-0 cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        <X size={14} />
      </button>
    </div>
  )
}
