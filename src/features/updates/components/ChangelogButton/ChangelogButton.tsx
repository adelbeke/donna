import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '@/shared/components/ui/Modal.tsx'
import { useUpdateCheck, isNewer } from '@/features/updates/queries/useUpdateCheck.ts'
import { useChangelog } from '@/features/updates/queries/useChangelog.ts'
import { useChangelogStore } from '@/features/updates/stores/changelogStore.ts'
import { parseChangelogBody } from '@/features/updates/lib/parseChangelog.ts'

export const ChangelogButton = () => {
  const [open, setOpen] = useState(false)
  const { data: latestVersion } = useUpdateCheck()
  const lastSeenVersion = useChangelogStore((s) => s.lastSeenVersion)
  const markSeen = useChangelogStore((s) => s.markSeen)
  const { data: releases, isLoading, isError } = useChangelog(open)

  const unread = !!latestVersion && (!lastSeenVersion || isNewer(latestVersion, lastSeenVersion))

  const onOpen = () => {
    setOpen(true)
    if (latestVersion) markSeen(latestVersion)
  }

  return (
    <>
      <button
        onClick={onOpen}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
      >
        <Sparkles size={13} />
        What's new
        {unread && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
            New
          </span>
        )}
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="What's new">
        {isLoading ? (
          <p className="px-3 py-2 text-xs text-[var(--color-text-muted)]">Loading...</p>
        ) : isError ? (
          <p className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
            Failed to load release notes
          </p>
        ) : !releases || releases.length === 0 ? (
          <p className="px-3 py-2 text-xs text-[var(--color-text-muted)]">No releases found</p>
        ) : (
          <div className="space-y-4">
            {releases.map((release) => {
              const sections = parseChangelogBody(release.body)
              return (
                <div key={release.tag_name}>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {release.tag_name}
                    <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">
                      {new Date(release.published_at).toLocaleDateString()}
                    </span>
                    {release.tag_name.replace(/^v/, '') === __APP_VERSION__ && (
                      <span className="ml-2 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                        Current
                      </span>
                    )}
                  </p>
                  {sections.length === 0 ? (
                    <p className="text-xs text-[var(--color-text-muted)]">No details</p>
                  ) : (
                    sections.map((section) => (
                      <div key={section.heading} className="mt-1">
                        <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                          {section.heading}
                        </p>
                        <ul className="list-disc list-inside">
                          {section.items.map((item) => (
                            <li key={item} className="text-xs text-[var(--color-text-muted)]">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Modal>
    </>
  )
}
