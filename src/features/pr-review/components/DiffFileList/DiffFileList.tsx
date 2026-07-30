import { useMemo, useState } from 'react'
import { computeInitialExpansion } from '../../lib/expansion'
import { groupThreadsByPath } from '../../lib/threadAnchor'
import { DiffFile } from '../DiffFile/DiffFile'
import type { PRFile, PRKey, PRReviewThread } from '../../types'

type Props = {
  files: PRFile[]
  threads: PRReviewThread[]
  filesTruncated: boolean
  prKey: PRKey
  pullRequestId: string | null
}

export const DiffFileList = ({ files, threads, filesTruncated, prKey, pullRequestId }: Props) => {
  const [expansion, setExpansion] = useState(() => computeInitialExpansion(files))
  const threadsByPath = useMemo(() => groupThreadsByPath(threads, files), [threads, files])

  const toggle = (filename: string) =>
    setExpansion((prev) => new Map(prev).set(filename, !prev.get(filename)))

  return (
    <div className="space-y-2">
      {files.map((file) => (
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
  )
}
