import type { DiffRow } from '../types'

// ponytail: tokenizing thousands of rows on expand janks the frame — big files render plain.
export const MAX_HIGHLIGHT_ROWS = 500
// ponytail: caps a huge generated file from janking the modal; same truncation-notice pattern as
// parsePatch's existing `truncated` flag.
const MAX_FULL_FILE_ROWS = 5000

export const expandGapId = (row: DiffRow): string => `expand-${row.expandAfterNewLine ?? 0}`

// Replaces each expanded 'expand' row with the real context rows it stood in for, sliced out of
// the head-side file blob. Old/new line numbers are derived from the gap's anchors since an
// unchanged run of lines advances both cursors together.
export const mergeExpandedContext = (
  rows: DiffRow[],
  blobLines: string[] | undefined,
  expandedGapIds: Set<string>
): DiffRow[] => {
  if (!blobLines) return rows

  return rows.flatMap((row): DiffRow[] => {
    if (row.type !== 'expand' || !expandedGapIds.has(expandGapId(row))) return [row]

    const afterOld = row.expandAfterOldLine ?? 0
    const afterNew = row.expandAfterNewLine ?? 0
    const count = Math.max(0, row.expandCount ?? blobLines.length - afterNew)

    return Array.from({ length: count }, (_, i) => ({
      type: 'context',
      content: blobLines[afterNew + i] ?? '',
      oldLine: afterOld + i + 1,
      newLine: afterNew + i + 1,
    }))
  })
}

// Expands every gap at once and drops the now-redundant hunk markers, turning the row list into
// "the whole file, diff inline".
export const buildFullFileRows = (
  rows: DiffRow[],
  blobLines: string[] | undefined
): { rows: DiffRow[]; truncated: boolean } => {
  if (!blobLines) return { rows: [], truncated: false }
  const allGapIds = new Set(rows.filter((r) => r.type === 'expand').map(expandGapId))
  const merged = mergeExpandedContext(rows, blobLines, allGapIds).filter((r) => r.type !== 'hunk')
  return merged.length <= MAX_FULL_FILE_ROWS
    ? { rows: merged, truncated: false }
    : { rows: merged.slice(0, MAX_FULL_FILE_ROWS), truncated: true }
}
