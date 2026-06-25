import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

const FEEDBACK_DURATION_DEFAULT_DELAY = 3000
// Matches Tailwind's default transition-opacity duration
const TOOLTIP_TRANSITION_MS = 150

export function CopyWithFeedback({
  text,
  label,
  feedbackDuration = FEEDBACK_DURATION_DEFAULT_DELAY,
}: {
  text: string
  label: string
  feedbackDuration?: number
}) {
  const [copied, setCopied] = useState(false)
  const [showCopied, setShowCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setShowCopied(true)
    setTimeout(() => {
      setCopied(false)
      setTimeout(() => setShowCopied(false), TOOLTIP_TRANSITION_MS)
    }, feedbackDuration)
  }

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
      >
        {showCopied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
      </button>
      <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs rounded bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] whitespace-nowrap pointer-events-none transition-opacity ${copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {showCopied ? 'Copied!' : label}
      </span>
    </div>
  )
}
