import { useParams } from 'react-router'
import { usePRFiles } from '../../queries/usePRFiles'
import { usePRThreads } from '../../queries/usePRThreads'
import { PRDetailHeader } from '../PRDetailHeader/PRDetailHeader'
import { DiffFileList } from '../DiffFileList/DiffFileList'
import { DonnaPRViewHint } from '../DonnaPRViewHint/DonnaPRViewHint'
import { usePRStore } from '@/features/pull-requests/exports'

export const PRDetailPage = () => {
  const { owner = '', repo = '', number = '' } = useParams()
  const prKey = { owner, repo, number: Number(number) }

  const donnaPRViewHintDismissed = usePRStore((s) => s.donnaPRViewHintDismissed)
  const dismissDonnaPRViewHint = usePRStore((s) => s.dismissDonnaPRViewHint)

  const { data: filesData, isLoading: filesLoading, error: filesError } = usePRFiles(prKey)
  const { data: threadsData, isLoading: threadsLoading, error: threadsError } = usePRThreads(prKey)

  const isLoading = filesLoading || threadsLoading
  const error = filesError || threadsError

  return (
    <div>
      {!donnaPRViewHintDismissed && <DonnaPRViewHint onDismiss={dismissDonnaPRViewHint} />}

      {threadsData?.pr && <PRDetailHeader pr={threadsData.pr} />}

      {isLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-subtle)] p-4 text-sm text-[var(--color-danger)]">
          Failed to load this pull request.
        </div>
      )}

      {!isLoading && !error && filesData && (
        <DiffFileList
          files={filesData.files}
          threads={threadsData?.threads ?? []}
          filesTruncated={filesData.truncated}
          prKey={prKey}
          pullRequestId={threadsData?.pr.id ?? null}
        />
      )}
    </div>
  )
}
