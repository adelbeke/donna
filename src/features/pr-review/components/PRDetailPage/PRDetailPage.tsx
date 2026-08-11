import { useState } from 'react'
import { useParams } from 'react-router'
import { usePRFiles } from '../../queries/usePRFiles'
import { usePRThreads } from '../../queries/usePRThreads'
import { PRDetailHeader } from '../PRDetailHeader/PRDetailHeader'
import { PRDescription } from '../PRDescription/PRDescription'
import { PRDetailTabs, type PRDetailTab } from '../PRDetailTabs/PRDetailTabs'
import { DiffFileList } from '../DiffFileList/DiffFileList'
import { DonnaPRViewHint } from '../DonnaPRViewHint/DonnaPRViewHint'
import { GeneralComments } from '../GeneralComments/GeneralComments'
import { ReviewFeed } from '../ReviewFeed/ReviewFeed'
import { ReviewActions } from '../ReviewActions/ReviewActions'
import { usePRStore } from '@/features/pull-requests/exports'

export const PRDetailPage = () => {
  const { owner = '', repo = '', number = '' } = useParams()
  const prKey = { owner, repo, number: Number(number) }
  const [tab, setTab] = useState<PRDetailTab>('review')

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

      {!isLoading && !error && filesData && threadsData?.pr && (
        <>
          <PRDescription body={threadsData.pr.body} />
          <PRDetailTabs active={tab} onChange={setTab} />

          {tab === 'feed' && (
            <>
              <ReviewFeed reviews={threadsData.reviews} />
              <GeneralComments
                comments={threadsData.comments}
                pullRequestId={threadsData.pr.id}
                prKey={prKey}
              />
            </>
          )}

          {tab === 'review' && (
            <DiffFileList
              files={filesData.files}
              threads={threadsData.threads}
              filesTruncated={filesData.truncated}
              prKey={prKey}
              pullRequestId={threadsData.pr.id}
              baseRef={threadsData.pr.baseRefName}
              headRefOid={threadsData.pr.headRefOid}
              pendingReview={threadsData.pendingReview}
            />
          )}

          <ReviewActions
            prKey={prKey}
            pullRequestId={threadsData.pr.id}
            prAuthorLogin={threadsData.pr.author?.login ?? null}
            pendingReview={threadsData.pendingReview}
          />
        </>
      )}
    </div>
  )
}
