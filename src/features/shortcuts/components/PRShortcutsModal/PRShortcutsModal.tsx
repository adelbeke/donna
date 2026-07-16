import { useState } from 'react'
import { Loader2, Play } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal.tsx'
import { useShortcutStore } from '../../stores/shortcutStore'
import type { ShortcutRunResult } from '../../types'
import type { PullRequest } from '@/types/github'

type Props = {
  isOpen: boolean
  onClose: () => void
  pr: PullRequest
  repoPath: string
}

type RunState = { running?: boolean; result?: ShortcutRunResult; error?: string }

export const PRShortcutsModal = ({ isOpen, onClose, pr, repoPath }: Props) => {
  const shortcuts = useShortcutStore((s) => s.shortcuts)
  const [runStates, setRunStates] = useState<Record<string, RunState>>({})

  const run = async (id: string, shortcutName: string, shortcutBody: string) => {
    if (
      !window.confirm(`Post "${shortcutName}" as a comment on PR #${pr.number}?\n\n${shortcutBody}`)
    )
      return
    setRunStates((s) => ({ ...s, [id]: { running: true } }))
    try {
      const result = await window.electronAPI!.shortcuts.run(repoPath, pr.number, shortcutBody)
      setRunStates((s) => ({ ...s, [id]: { result } }))
    } catch (e) {
      setRunStates((s) => ({ ...s, [id]: { error: (e as Error).message } }))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Shortcuts · ${pr.repository.nameWithOwner} #${pr.number}`}
      className="min-w-1/2"
    >
      <div className="space-y-3">
        {shortcuts.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">No shortcuts defined yet</p>
        )}
        {shortcuts.map((shortcut) => {
          const state = runStates[shortcut.id]
          return (
            <div
              key={shortcut.id}
              className="rounded border border-[var(--color-border-subtle)] p-2 space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                  {shortcut.name}
                </span>
                <span className="text-xs text-[var(--color-text-muted)] truncate flex-1">
                  {shortcut.body}
                </span>
                <button
                  onClick={() => run(shortcut.id, shortcut.name, shortcut.body)}
                  disabled={state?.running}
                  title="Run"
                  className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state?.running ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} />
                  )}
                </button>
              </div>

              {state?.error && <p className="text-xs text-[var(--color-danger)]">{state.error}</p>}

              {state?.result && (
                <div className="space-y-1">
                  <span
                    className={`inline-block text-xs px-1.5 py-0.5 rounded ${
                      state.result.exitCode === 0
                        ? 'bg-[var(--color-success-subtle)] text-[var(--color-success)]'
                        : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'
                    }`}
                  >
                    exit {state.result.exitCode ?? '?'}
                  </span>
                  {state.result.timedOut && (
                    <span className="text-xs text-[var(--color-danger)]"> timed out</span>
                  )}
                  {state.result.stdout && (
                    <pre className="font-mono text-xs whitespace-pre-wrap max-h-64 overflow-y-auto text-[var(--color-success)]">
                      {state.result.stdout}
                    </pre>
                  )}
                  {state.result.stderr && (
                    <pre className="font-mono text-xs whitespace-pre-wrap max-h-64 overflow-y-auto text-[var(--color-danger)]">
                      {state.result.stderr}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
