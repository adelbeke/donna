import type { PRFile } from '../types'

const AUTO_EXPAND_CHANGES = 400
const AUTO_EXPAND_FILES = 20

// A file starts expanded iff it's small AND we haven't already auto-expanded too many files —
// keeps a PR with hundreds of files from rendering hundreds of open diffs at once.
export const computeInitialExpansion = (files: PRFile[]): Map<string, boolean> => {
  const expansion = new Map<string, boolean>()
  let expandedCount = 0
  for (const file of files) {
    const shouldExpand = file.changes <= AUTO_EXPAND_CHANGES && expandedCount < AUTO_EXPAND_FILES
    expansion.set(file.filename, shouldExpand)
    if (shouldExpand) expandedCount++
  }
  return expansion
}
