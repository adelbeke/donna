import type {PullRequest} from "@/types/github.ts";
import type {Worktree} from "@/features/branches/types.ts";
import {useState} from "react";
import {CopyWithFeedback} from "@/shared/components/CopyWithFeedback/CopyWithFeedback.tsx";
import {Copy, ExternalLink, MoreVertical, Trash2} from "lucide-react";

export function BranchCard({
                               branch,
                               repo,
                               repoPath,
                               hue,
                               isCurrentBranch,
                               worktree,
                               pr,
                               onDeleted,
                           }: {
    branch: string
    repo: string
    repoPath: string
    hue: number
    isCurrentBranch: boolean
    worktree?: Worktree
    pr?: PullRequest
    onDeleted: () => void
}) {
    const shortPath = worktree?.path.replace(/^\/Users\/[^/]+/, '~')
    const isProtected = branch === 'main' || branch === 'master'
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    async function deleteBranch() {
        const message = isCurrentBranch
            ? `Delete branch "${branch}"?\n\nYou're currently on this branch — git will switch to main first.`
            : `Delete branch "${branch}"?\nThe branch must be fully merged.`
        if (!window.confirm(message)) return
        setIsMenuOpen(false)
        try {
            if (isCurrentBranch) await window.electronAPI!.branches.switchToDefault(repoPath)
            await window.electronAPI!.branches.delete(repoPath, branch)
            onDeleted()
        } catch (e) {
            setDeleteError((e as Error).message)
        }
    }

    async function removeWorktree() {
        const wt = worktree!
        const message = wt.isDirty
            ? `⚠️ "${branch}" has uncommitted changes.\n\nRemoving this worktree will permanently delete those changes.\n\nAre you sure?`
            : `Remove worktree at "${wt.path}"?`
        if (!window.confirm(message)) return
        setIsMenuOpen(false)
        try {
            await window.electronAPI!.worktrees.remove(repoPath, wt.path, wt.isDirty)
            onDeleted()
        } catch (e) {
            setDeleteError((e as Error).message)
        }
    }

    return (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
        <span
            style={{
                backgroundColor: `hsla(${hue}, 65%, 50%, 0.18)`,
                color: `hsl(${hue}, 70%, 65%)`,
            }}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
        >
          {repo}
        </span>
                <span className="text-sm font-medium text-[var(--color-text-primary)] font-mono">
          {branch}
        </span>
                <CopyWithFeedback text={branch} label="Copy branch name" />
                {worktree && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
            worktree
          </span>
                )}
                {worktree?.isDirty && (
                    <span
                        title="Uncommitted changes"
                        className="w-2 h-2 rounded-full bg-yellow-400 inline-block"
                    />
                )}
                <div className="ml-auto flex items-center gap-1">
                    {pr && (
                        <a
                            href={pr.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-[var(--color-border-subtle)] text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors font-mono"
                        >
                            #{pr.number}
                            <ExternalLink size={10} />
                        </a>
                    )}
                    {!isProtected && (
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen((v) => !v)}
                                title="More actions"
                                className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer"
                            >
                                <MoreVertical size={14} />
                            </button>
                            {isMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                                    <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-lg py-1">
                                        {worktree ? (
                                            <button
                                                onClick={removeWorktree}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-danger)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer"
                                            >
                                                <Trash2 size={12} />
                                                Remove worktree
                                            </button>
                                        ) : (
                                            <button
                                                onClick={deleteBranch}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-danger)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer"
                                            >
                                                <Trash2 size={12} />
                                                Delete branch
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {deleteError && <p className="text-xs text-[var(--color-danger)]">{deleteError}</p>}
            <div className="flex flex-wrap gap-2 items-center">
                {worktree && (
                    <CopyWithFeedback
                        text={`cd ${worktree.path}`}
                        label="Copy cd command"
                        buttonClassName="flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] transition-colors cursor-pointer font-mono"
                    >
                        <Copy size={11} />
                        cd {shortPath}
                    </CopyWithFeedback>
                )}
                <CopyWithFeedback
                    text={`git switch ${branch}`}
                    label="Copy git switch command"
                    buttonClassName="flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] transition-colors cursor-pointer font-mono"
                >
                    <Copy size={11} />
                    git switch {branch}
                </CopyWithFeedback>
            </div>
        </div>
    )
}