import { useEffect, useMemo, useRef } from 'react'
import type { Language } from 'prism-react-renderer'
import { Modal } from '@/shared/components/ui/Modal'
import { DiffRowView } from '../DiffRowView/DiffRowView'
import { MAX_HIGHLIGHT_ROWS } from '../../lib/expandContext'
import type { DiffRow } from '../../types'

type Props = {
  isOpen: boolean
  onClose: () => void
  filename: string
  blobUrl: string
  rows: DiffRow[]
  truncated: boolean
  language?: Language
  isLoading: boolean
}

export const FullFileModal = ({
  isOpen,
  onClose,
  filename,
  blobUrl,
  rows,
  truncated,
  language,
  isLoading,
}: Props) => {
  const firstChangeRef = useRef<HTMLDivElement>(null)
  const firstChangeIndex = useMemo(
    () => rows.findIndex((r) => r.type === 'add' || r.type === 'del'),
    [rows]
  )

  useEffect(() => {
    if (isOpen) firstChangeRef.current?.scrollIntoView?.({ block: 'center' })
  }, [isOpen, firstChangeIndex])

  const highlightLanguage =
    rows.length > 0 && rows.length <= MAX_HIGHLIGHT_ROWS ? language : undefined

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={filename}
      size="full"
      actions={
        <a
          href={blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          Open on GitHub
        </a>
      }
    >
      {isLoading ? (
        <p className="px-3 py-4 text-xs text-[var(--color-text-muted)]">Loading file…</p>
      ) : (
        <div>
          {rows.map((row, i) => (
            <div key={i} ref={i === firstChangeIndex ? firstChangeRef : undefined}>
              <DiffRowView row={row} language={highlightLanguage} />
            </div>
          ))}
          {truncated && (
            <p className="px-3 py-2 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
              Showing a truncated view of this file.{' '}
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] hover:underline"
              >
                Open file on GitHub
              </a>
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
