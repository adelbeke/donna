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
  // start at 1 (not 0) so the gap before the first hunk is detected the same way as any other:
  // "next line to show" defaults to the top of the file
  let oldCursor = 1
  let newCursor = 1
  let truncated = false
  let sawHunk = false

  const pushExpandGap = (count: number | null) =>
    rows.push({
      type: 'expand',
      content: '',
      oldLine: null,
      newLine: null,
      expandCount: count,
      expandAfterOldLine: oldCursor - 1,
      expandAfterNewLine: newCursor - 1,
    })

  for (const line of lines) {
    if (rows.length >= MAX_ROWS_PER_FILE) {
      truncated = true
      break
    }

    const hunkMatch = HUNK_RE.exec(line)
    if (hunkMatch) {
      const newStart = Number(hunkMatch[3])
      const gap = newStart - newCursor
      if (gap > 0) pushExpandGap(gap)
      oldCursor = Number(hunkMatch[1])
      newCursor = newStart
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

  if (sawHunk && !truncated) pushExpandGap(null)

  return { kind: 'rows', rows, truncated }
}

export const unavailableReason = (file: PRFile): 'rename-only' | 'binary-or-large' =>
  (file.status === 'renamed' || file.status === 'copied') && file.changes === 0
    ? 'rename-only'
    : 'binary-or-large'
