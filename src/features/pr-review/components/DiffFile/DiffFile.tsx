import { useMemo, useState } from 'react'
import { parsePatch, unavailableReason } from '../../lib/parsePatch'
import { anchorId, anchorThreadsToRows, commentTargetForRow, rowKeys } from '../../lib/threadAnchor'
import {
  buildFullFileRows,
  expandGapId,
  MAX_HIGHLIGHT_ROWS,
  mergeExpandedContext,
} from '../../lib/expandContext'
import { languageFor } from '../../lib/language'
import { DiffFileHeader } from '../DiffFileHeader/DiffFileHeader'
import { DiffRowView } from '../DiffRowView/DiffRowView'
import { DiffThread } from '../DiffThread/DiffThread'
import { CommentComposer } from '../CommentComposer/CommentComposer'
import { FullFileModal } from '../FullFileModal/FullFileModal'
import { useCreateThread } from '../../queries/useCreateThread'
import { useReplyToThread } from '../../queries/useReplyToThread'
import { useResolveThread } from '../../queries/useResolveThread'
import { useFileBlob } from '../../queries/useFileBlob'
import type { CommentMode, PendingReview, PRFile, PRKey, PRReviewThread } from '../../types'

type Props = {
  file: PRFile
  threads: PRReviewThread[]
  isExpanded: boolean
  onToggle: () => void
  prKey: PRKey
  pullRequestId: string | null // null while usePRThreads is still pending — blocks new-thread creation
  pendingReview?: PendingReview | null
  headRefOid: string
}

export const DiffFile = ({
  file,
  threads,
  isExpanded,
  onToggle,
  prKey,
  pullRequestId,
  pendingReview = null,
  headRefOid,
}: Props) => {
  const [composerAt, setComposerAt] = useState<string | null>(null)
  const [composerMode, setComposerMode] = useState<CommentMode>('one-shot')
  const [expandedGapIds, setExpandedGapIds] = useState<Set<string>>(new Set())
  const [isFullFileOpen, setIsFullFileOpen] = useState(false)

  const createThread = useCreateThread(prKey)
  const replyToThread = useReplyToThread(prKey)
  const resolveThread = useResolveThread(prKey)

  const parsed = useMemo(
    () => (isExpanded || isFullFileOpen ? parsePatch(file.patch) : null),
    [isExpanded, isFullFileOpen, file.patch]
  )

  const { data: blob, isFetching: isBlobFetching } = useFileBlob(
    prKey,
    headRefOid,
    file.filename,
    expandedGapIds.size > 0 || isFullFileOpen
  )

  const rows = useMemo(
    () =>
      parsed?.kind === 'rows' ? mergeExpandedContext(parsed.rows, blob?.lines, expandedGapIds) : [],
    [parsed, blob, expandedGapIds]
  )

  const fullFile = useMemo(
    () =>
      isFullFileOpen && parsed?.kind === 'rows'
        ? buildFullFileRows(parsed.rows, blob?.lines)
        : { rows: [], truncated: false },
    [isFullFileOpen, parsed, blob]
  )

  const language = useMemo(() => languageFor(file.filename), [file.filename])
  const highlightLanguage =
    rows.length > 0 && rows.length <= MAX_HIGHLIGHT_ROWS ? language : undefined

  const anchored = useMemo(() => {
    if (!parsed || parsed.kind !== 'rows') return null
    return anchorThreadsToRows(threads, rows)
  }, [parsed, threads, rows])

  const commentCount = threads.reduce((n, t) => n + t.comments.nodes.length, 0)

  const onExpand = (row: (typeof rows)[number]) =>
    setExpandedGapIds((prev) => new Set(prev).add(expandGapId(row)))

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
        onOpenFullFile={file.patch ? () => setIsFullFileOpen(true) : undefined}
      />

      <FullFileModal
        isOpen={isFullFileOpen}
        onClose={() => setIsFullFileOpen(false)}
        filename={file.filename}
        blobUrl={file.blob_url}
        rows={fullFile.rows}
        truncated={fullFile.truncated}
        language={language}
        isLoading={isFullFileOpen && !blob}
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
          {rows.map((row, i) => {
            const keys = rowKeys(row)
            const rowThreads = keys.flatMap((k) => anchored.byRow.get(k) ?? [])
            const target = pullRequestId ? commentTargetForRow(row) : null
            const key = keys[0] ?? (row.type === 'expand' ? expandGapId(row) : `row-${i}`)
            const isComposerOpen = composerAt === key

            return (
              <div key={key}>
                <DiffRowView
                  row={row}
                  onAddComment={
                    target
                      ? () => {
                          setComposerMode(pendingReview ? 'review' : 'one-shot')
                          setComposerAt(key)
                        }
                      : undefined
                  }
                  language={highlightLanguage}
                  onExpand={row.type === 'expand' ? () => onExpand(row) : undefined}
                  isExpanding={row.type === 'expand' && isBlobFetching}
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
                    onModeChange={pendingReview ? undefined : setComposerMode}
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
