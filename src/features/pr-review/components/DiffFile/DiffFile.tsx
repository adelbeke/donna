import { useMemo, useState } from 'react'
import { parsePatch, unavailableReason } from '../../lib/parsePatch'
import { anchorId, anchorThreadsToRows, commentTargetForRow, rowKeys } from '../../lib/threadAnchor'
import { languageFor } from '../../lib/language'
import { DiffFileHeader } from '../DiffFileHeader/DiffFileHeader'
import { DiffRowView } from '../DiffRowView/DiffRowView'
import { DiffThread } from '../DiffThread/DiffThread'
import { CommentComposer } from '../CommentComposer/CommentComposer'
import { useCreateThread } from '../../queries/useCreateThread'
import { useReplyToThread } from '../../queries/useReplyToThread'
import { useResolveThread } from '../../queries/useResolveThread'
import type { CommentMode, PendingReview, PRFile, PRKey, PRReviewThread } from '../../types'

// ponytail: tokenizing thousands of rows on expand janks the frame — big files render plain.
const MAX_HIGHLIGHT_ROWS = 500

type Props = {
  file: PRFile
  threads: PRReviewThread[]
  isExpanded: boolean
  onToggle: () => void
  prKey: PRKey
  pullRequestId: string | null // null while usePRThreads is still pending — blocks new-thread creation
  pendingReview?: PendingReview | null
}

export const DiffFile = ({
  file,
  threads,
  isExpanded,
  onToggle,
  prKey,
  pullRequestId,
  pendingReview = null,
}: Props) => {
  const [composerAt, setComposerAt] = useState<string | null>(null)
  const [composerMode, setComposerMode] = useState<CommentMode>('one-shot')

  const createThread = useCreateThread(prKey)
  const replyToThread = useReplyToThread(prKey)
  const resolveThread = useResolveThread(prKey)

  const parsed = useMemo(
    () => (isExpanded ? parsePatch(file.patch) : null),
    [isExpanded, file.patch]
  )
  const language = useMemo(() => languageFor(file.filename), [file.filename])
  const highlightLanguage =
    parsed?.kind === 'rows' && parsed.rows.length <= MAX_HIGHLIGHT_ROWS ? language : undefined

  const anchored = useMemo(() => {
    if (!parsed || parsed.kind !== 'rows') return null
    return anchorThreadsToRows(threads, parsed.rows)
  }, [parsed, threads])

  const commentCount = threads.reduce((n, t) => n + t.comments.nodes.length, 0)

  return (
    <div
      id={anchorId(file.filename)}
      className="scroll-mt-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] overflow-hidden"
    >
      <DiffFileHeader
        file={file}
        isExpanded={isExpanded}
        onToggle={onToggle}
        commentCount={commentCount}
        outdatedThreads={anchored?.unanchored ?? []}
        fileLevelThreads={anchored?.fileLevel ?? []}
      />

      {isExpanded && parsed?.kind === 'unavailable' && (
        <p className="px-3 py-4 text-xs text-[var(--color-text-muted)]">
          Diff not available ({unavailableReason(file)}).{' '}
          <a
            href={file.blob_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:underline"
          >
            View file on GitHub
          </a>
        </p>
      )}

      {isExpanded && parsed?.kind === 'rows' && anchored && (
        <div>
          {parsed.rows.map((row, i) => {
            const keys = rowKeys(row)
            const rowThreads = keys.flatMap((k) => anchored.byRow.get(k) ?? [])
            const target = pullRequestId ? commentTargetForRow(row) : null
            const key = keys[0] ?? `row-${i}`
            const isComposerOpen = composerAt === key

            return (
              <div key={key}>
                <DiffRowView
                  row={row}
                  onAddComment={
                    target
                      ? () => {
                          setComposerMode('one-shot')
                          setComposerAt(key)
                        }
                      : undefined
                  }
                  language={highlightLanguage}
                />
                {rowThreads.map((thread) => (
                  <DiffThread
                    key={thread.id}
                    thread={thread}
                    onReply={(body) => replyToThread.mutate({ threadId: thread.id, body })}
                    isReplyPending={replyToThread.isPending}
                    replyError={replyToThread.isError ? replyToThread.error.message : null}
                    onToggleResolve={() =>
                      resolveThread.mutate({ threadId: thread.id, resolve: !thread.isResolved })
                    }
                    isResolvePending={resolveThread.isPending}
                  />
                ))}
                {isComposerOpen && target && pullRequestId && (
                  <CommentComposer
                    onSubmit={(body) =>
                      createThread.mutate(
                        {
                          pullRequestId,
                          path: file.filename,
                          ...target,
                          body,
                          mode: composerMode,
                          pendingReviewId: pendingReview?.id ?? null,
                        },
                        { onSuccess: () => setComposerAt(null) }
                      )
                    }
                    onCancel={() => setComposerAt(null)}
                    isPending={createThread.isPending}
                    error={createThread.isError ? createThread.error.message : null}
                    mode={composerMode}
                    onModeChange={setComposerMode}
                    autoFocus
                    submitLabel={
                      composerMode === 'one-shot'
                        ? 'Comment'
                        : pendingReview
                          ? 'Add to review'
                          : 'Start a review'
                    }
                  />
                )}
              </div>
            )
          })}
          {parsed.truncated && (
            <p className="px-3 py-2 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
              Showing a truncated view of this file.{' '}
              <a
                href={file.blob_url}
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
    </div>
  )
}
