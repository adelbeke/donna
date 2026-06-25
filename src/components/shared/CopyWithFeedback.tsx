import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { ButtonWithTooltip } from '../ui/ButtonWithTooltip.tsx'

const FEEDBACK_DURATION_DEFAULT_DELAY = 3000
// Matches Tailwind's default transition-opacity duration
const TOOLTIP_TRANSITION_MS = 150

export function CopyWithFeedback({
  text,
  label,
  feedbackDuration = FEEDBACK_DURATION_DEFAULT_DELAY,
  icon,
  children,
  buttonClassName,
}: {
  text: string
  label: string
  feedbackDuration?: number
  icon?: ReactNode
  children?: ReactNode
  buttonClassName?: string
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
    <ButtonWithTooltip
      label={showCopied ? 'Copied!' : label}
      onClick={handleCopy}
      tooltipClassName={copied ? 'opacity-100' : 'opacity-0 group-hover/tooltip:opacity-100'}
      buttonClassName={buttonClassName}
    >
      {children ??
        (showCopied ? (
          <Check size={13} className="text-green-500" />
        ) : (
          (icon ?? <Copy size={13} />)
        ))}
    </ButtonWithTooltip>
  )
}
