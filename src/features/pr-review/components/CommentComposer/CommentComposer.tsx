import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

type Props = {
  onSubmit: (body: string) => void
  onCancel: () => void
  isPending: boolean
  error?: string | null
  placeholder?: string
  submitLabel?: string
}

export const CommentComposer = ({
  onSubmit,
  onCancel,
  isPending,
  error,
  placeholder = 'Leave a comment',
  submitLabel = 'Comment',
}: Props) => {
  const [body, setBody] = useState('')
  const trimmed = body.trim()

  // clear the typed text once a pending submit resolves successfully — a composer that
  // stays mounted (the reply box) has no other signal that its submission landed
  const wasPending = useRef(false)
  useEffect(() => {
    if (wasPending.current && !isPending && !error) setBody('')
    wasPending.current = isPending
  }, [isPending, error])

  const submit = () => {
    if (!trimmed || isPending) return
    onSubmit(trimmed)
  }

  const cancel = () => {
    setBody('')
    onCancel()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      cancel()
      return
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="p-2 space-y-2">
      <textarea
        autoFocus
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isPending}
        placeholder={placeholder}
        rows={3}
        className="w-full text-xs px-2 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-60"
      />
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={cancel}
          disabled={isPending}
          className="text-xs px-2 py-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!trimmed || isPending}
          className="text-xs px-2 py-1 rounded bg-[var(--color-accent)] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Submitting…' : submitLabel}
        </button>
      </div>
    </div>
  )
}
