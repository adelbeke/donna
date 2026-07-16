import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal.tsx'
import { useShortcutStore } from '../../stores/shortcutStore'

type Props = {
  isOpen: boolean
  onClose: () => void
}

type EditState = { name: string; body: string }

export const ShortcutsManagerModal = ({ isOpen, onClose }: Props) => {
  const shortcuts = useShortcutStore((s) => s.shortcuts)
  const addShortcut = useShortcutStore((s) => s.addShortcut)
  const removeShortcut = useShortcutStore((s) => s.removeShortcut)
  const updateShortcut = useShortcutStore((s) => s.updateShortcut)
  const [edits, setEdits] = useState<Record<string, EditState | undefined>>({})
  const [name, setName] = useState('')
  const [body, setBody] = useState('')

  const startEdit = (id: string, current: EditState) => {
    setEdits((e) => ({ ...e, [id]: current }))
  }

  const cancelEdit = (id: string) => {
    setEdits((e) => ({ ...e, [id]: undefined }))
  }

  const saveEdit = (id: string) => {
    const edit = edits[id]
    if (!edit) return
    const trimmedName = edit.name.trim()
    const trimmedBody = edit.body.trim()
    if (!trimmedName || !trimmedBody) return
    updateShortcut(id, { name: trimmedName, body: trimmedBody })
    cancelEdit(id)
  }

  const handleAdd = () => {
    const trimmedName = name.trim()
    const trimmedBody = body.trim()
    if (!trimmedName || !trimmedBody) return
    addShortcut({ name: trimmedName, body: trimmedBody })
    setName('')
    setBody('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Shortcuts" className="min-w-1/2">
      <div className="space-y-3">
        <p className="text-xs text-[var(--color-text-muted)]">
          Running a shortcut posts this text as a PR comment via <code>gh pr comment</code> — no
          local checkout, no other command is executed.
        </p>
        {shortcuts.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">No shortcuts defined yet</p>
        )}
        {shortcuts.map((shortcut) => {
          const edit = edits[shortcut.id]
          return (
            <div
              key={shortcut.id}
              className="rounded border border-[var(--color-border-subtle)] p-2 space-y-1.5"
            >
              {edit ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={edit.name}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [shortcut.id]: { ...edit, name: e.target.value },
                      }))
                    }
                    className="w-full text-xs px-2 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                  <textarea
                    value={edit.body}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [shortcut.id]: { ...edit, body: e.target.value },
                      }))
                    }
                    rows={2}
                    className="w-full text-xs px-2 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveEdit(shortcut.id)}
                      className="text-xs px-3 py-1.5 rounded bg-[var(--color-accent)] text-white cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => cancelEdit(shortcut.id)}
                      className="text-xs px-3 py-1.5 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                    {shortcut.name}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] truncate flex-1">
                    {shortcut.body}
                  </span>
                  <button
                    onClick={() =>
                      startEdit(shortcut.id, { name: shortcut.name, body: shortcut.body })
                    }
                    title="Edit"
                    className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => removeShortcut(shortcut.id)}
                    title="Delete"
                    className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          )
        })}

        <div className="space-y-1.5 pt-2 border-t border-[var(--color-border-subtle)]">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Shortcut name"
            className="w-full text-xs px-2 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Comment text, e.g. LGTM, tests are passing"
            rows={2}
            className="w-full text-xs px-2 py-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
          <button
            onClick={handleAdd}
            className="text-xs px-3 py-1.5 rounded bg-[var(--color-accent)] text-white cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>
    </Modal>
  )
}
