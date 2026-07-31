import { CommentBody } from '../CommentBody/CommentBody'

type Props = { body: string }

export const PRDescription = ({ body }: Props) => {
  if (!body.trim()) return null

  return (
    <details className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">
        Description
      </summary>
      <div className="px-3 pb-3">
        <CommentBody body={body} />
      </div>
    </details>
  )
}
