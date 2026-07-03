const SEEN_IDS_KEY = 'donna-notified-review-request-ids'

// Diffs freshly-fetched review-request PR ids against previously seen ones.
// `seenIds === null` means "never checked before" — seed silently instead of
// notifying for every pre-existing PR on first run.
export const computeNewIds = (
  fetchedIds: string[],
  seenIds: string[] | null
): { newIds: string[]; nextSeenIds: string[] } => {
  if (seenIds === null) return { newIds: [], nextSeenIds: fetchedIds }
  const seen = new Set(seenIds)
  return { newIds: fetchedIds.filter((id) => !seen.has(id)), nextSeenIds: fetchedIds }
}

export const loadSeenIds = (): string[] | null => {
  const raw = localStorage.getItem(SEEN_IDS_KEY)
  return raw ? (JSON.parse(raw) as string[]) : null
}

export const saveSeenIds = (ids: string[]) => {
  localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(ids))
}
