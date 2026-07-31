import type { DiffRow, ParsedPatch, PRFile } from '../types'

const HUNK_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/
const MAX_ROWS_PER_FILE = 2000

// GitHub's REST `patch` field is absent for binary files, files above its size cap, and
// content-free renames — all three collapse to the same "nothing to show" state.
export const parsePatch = (patch: string | undefined): ParsedPatch => {
  if (!patch) return { kind: 'unavailable' }

  const lines = patch.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()

  const rows: DiffRow[] = []
  let oldCursor = 0
  let newCursor = 0
  let truncated = false
  let sawHunk = false

  for (const line of lines) {
    if (rows.length >= MAX_ROWS_PER_FILE) {
      truncated = true
      break
    }

    const hunkMatch = HUNK_RE.exec(line)
    if (hunkMatch) {
      oldCursor = Number(hunkMatch[1])
      newCursor = Number(hunkMatch[3])
      rows.push({ type: 'hunk', content: line, oldLine: null, newLine: null })
      sawHunk = true
      continue
    }
    // diff --git / index / --- / +++ preamble before the first hunk — not a diff line, skip
    if (!sawHunk) continue

    const marker = line[0]
    if (marker === '\\') {
      // '\ No newline at end of file' — annotates the previous row, not a row of its own
      const last = rows[rows.length - 1]
      if (last) last.noNewline = true
      continue
    }
    if (marker === '+') {
      rows.push({ type: 'add', content: line.slice(1), oldLine: null, newLine: newCursor++ })
      continue
    }
    if (marker === '-') {
      rows.push({ type: 'del', content: line.slice(1), oldLine: oldCursor++, newLine: null })
      continue
    }
    if (marker === ' ' || line === '') {
      rows.push({
        type: 'context',
        content: line.slice(1),
        oldLine: oldCursor++,
        newLine: newCursor++,
      })
      continue
    }
    // garbage before the first hunk (diff --git / index / --- / +++ preambles) — skip
  }

  return { kind: 'rows', rows, truncated }
}

export const unavailableReason = (file: PRFile): 'rename-only' | 'binary-or-large' =>
  (file.status === 'renamed' || file.status === 'copied') && file.changes === 0
    ? 'rename-only'
    : 'binary-or-large'
