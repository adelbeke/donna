import { MoreHorizontal, Plus } from 'lucide-react'
import { Highlight, type Language } from 'prism-react-renderer'
import type { DiffRow } from '../../types'

type Props = {
  row: DiffRow
  onAddComment?: () => void
  language?: Language
  onExpand?: () => void
  isExpanding?: boolean
}

const TOKEN_CLASS: Record<string, string> = {
  keyword: 'text-[var(--color-syntax-keyword)]',
  string: 'text-[var(--color-syntax-string)]',
  number: 'text-[var(--color-syntax-number)]',
  comment: 'text-[var(--color-syntax-comment)]',
  function: 'text-[var(--color-syntax-function)]',
  punctuation: 'text-[var(--color-syntax-punctuation)]',
}

const EMPTY_THEME = { plain: {}, styles: [] }

// ponytail: each row is tokenized on its own, so a multi-line block comment or template literal
// highlights per-line rather than as one span. Acceptable for review reading.
const HighlightedCode = ({ code, language }: { code: string; language: Language }) => (
  <Highlight code={code} language={language} theme={EMPTY_THEME}>
    {({ tokens }) =>
      tokens[0]?.map((token, i) => (
        <span key={i} className={TOKEN_CLASS[token.types[0]] ?? ''}>
          {token.content}
        </span>
      ))
    }
  </Highlight>
)

const ROW_BG: Record<DiffRow['type'], string> = {
  hunk: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]',
  add: 'bg-[var(--color-success-subtle)]',
  del: 'bg-[var(--color-danger-subtle)]',
  context: '',
  expand: '',
}

const SIGN: Record<DiffRow['type'], string> = {
  hunk: '',
  add: '+',
  del: '-',
  context: ' ',
  expand: '',
}

export const DiffRowView = ({ row, onAddComment, language, onExpand, isExpanding }: Props) => {
  if (row.type === 'hunk') {
    return (
      <div className={`px-2 py-0.5 text-xs font-mono ${ROW_BG.hunk}`}>
        {row.content}
        {row.noNewline && <span className="italic"> (no newline at end of file)</span>}
      </div>
    )
  }

  if (row.type === 'expand') {
    const label = isExpanding
      ? 'Loading…'
      : row.expandCount == null
        ? 'Expand down'
        : `Expand ${row.expandCount} line${row.expandCount === 1 ? '' : 's'}`
    return (
      <button
        onClick={onExpand}
        disabled={isExpanding}
        className="w-full flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-[var(--color-text-muted)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text-secondary)] cursor-pointer disabled:cursor-wait focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
      >
        <MoreHorizontal size={12} />
        {label}
      </button>
    )
  }

  return (
    <div className={`group/row flex text-xs font-mono ${ROW_BG[row.type]}`}>
      <div className="relative w-10 shrink-0 text-right pr-1 text-[var(--color-text-muted)] select-none tabular-nums">
        {onAddComment && (
          <button
            onClick={onAddComment}
            aria-label="Add comment"
            className="absolute left-0.5 top-0 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 rounded cursor-pointer text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
          >
            <Plus size={12} />
          </button>
        )}
        {row.oldLine ?? ''}
      </div>
      <div className="w-10 shrink-0 text-right pr-1 text-[var(--color-text-muted)] select-none tabular-nums">
        {row.newLine ?? ''}
      </div>
      <div className="w-4 shrink-0 select-none text-[var(--color-text-muted)]">
        {SIGN[row.type]}
      </div>
      <div className="flex-1 whitespace-pre overflow-x-auto pr-2">
        {language ? <HighlightedCode code={row.content} language={language} /> : row.content}
        {row.noNewline && (
          <span className="italic text-[var(--color-text-muted)]">
            {' '}
            (no newline at end of file)
          </span>
        )}
      </div>
    </div>
  )
}
