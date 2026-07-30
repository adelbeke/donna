import { useMemo, useState } from 'react'
import { computeInitialExpansion } from '../../lib/expansion'
import { anchorId, groupThreadsByPath } from '../../lib/threadAnchor'
import { buildFileTree } from '../../lib/fileTree'
import { ownersFor } from '../../lib/codeowners'
import { useCodeowners } from '../../queries/useCodeowners'
import { useViewerHandles } from '../../queries/useViewerHandles'
import { DiffFile } from '../DiffFile/DiffFile'
import { FileTree } from '../FileTree/FileTree'
import type { PRFile, PRKey, PRReviewThread } from '../../types'

type Props = {
  files: PRFile[]
  threads: PRReviewThread[]
  filesTruncated: boolean
  prKey: PRKey
  pullRequestId: string | null
  baseRef: string
}

export const DiffFileList = ({
  files,
  threads,
  filesTruncated,
  prKey,
  pullRequestId,
  baseRef,
}: Props) => {
  const [expansion, setExpansion] = useState(() => computeInitialExpansion(files))
  const [onlyMine, setOnlyMine] = useState(false)
  const threadsByPath = useMemo(() => groupThreadsByPath(threads, files), [threads, files])

  const { data: codeownersRules = [] } = useCodeowners(prKey, baseRef)
  const { data: viewerHandles = [] } = useViewerHandles(prKey.owner)

  const myFiles = useMemo(
    () =>
      new Set(
        files
          .filter((f) => ownersFor(f.filename, codeownersRules).some((o) => viewerHandles.includes(o)))
          .map((f) => f.filename)
      ),
    [files, codeownersRules, viewerHandles]
  )

  const visibleFiles = onlyMine ? files.filter((f) => myFiles.has(f.filename)) : files
  const tree = useMemo(() => buildFileTree(visibleFiles), [visibleFiles])

  const toggle = (filename: string) =>
    setExpansion((prev) => new Map(prev).set(filename, !prev.get(filename)))

  const onSelectFile = (filename: string) => {
    setExpansion((prev) => new Map(prev).set(filename, true))
    requestAnimationFrame(() => {
      document.getElementById(anchorId(filename))?.scrollIntoView({ block: 'start' })
    })
  }

  const onlyMineDisabledReason =
    myFiles.size === 0 ? 'No files here are owned by you or your teams in CODEOWNERS' : undefined

  return (
    <div className="flex gap-4 items-start">
      <aside className="hidden lg:block w-64 shrink-0 sticky top-20 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <FileTree nodes={tree} onSelectFile={onSelectFile} />
      </aside>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex justify-end">
          <button
            onClick={() => setOnlyMine((o) => !o)}
            disabled={myFiles.size === 0}
            title={onlyMineDisabledReason}
            className={`text-xs px-2 py-0.5 rounded transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
              ${
                onlyMine
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
              }`}
          >
            Only my files ({myFiles.size})
          </button>
        </div>
        {visibleFiles.map((file) => (
          <DiffFile
            key={file.filename}
            file={file}
            threads={threadsByPath.get(file.filename) ?? []}
            isExpanded={expansion.get(file.filename) ?? false}
            onToggle={() => toggle(file.filename)}
            prKey={prKey}
            pullRequestId={pullRequestId}
          />
        ))}
        {filesTruncated && (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-2">
            This PR has more files than Donna shows at once — view the rest on GitHub.
          </p>
        )}
      </div>
    </div>
  )
}
