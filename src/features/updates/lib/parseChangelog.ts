export type ChangelogSection = { heading: string; items: string[] }

export const parseChangelogBody = (body: string | null): ChangelogSection[] => {
  const sections: ChangelogSection[] = []
  for (const line of (body ?? '').split('\n')) {
    if (line.startsWith('### ')) {
      sections.push({ heading: line.slice(4).trim(), items: [] })
    } else if (line.startsWith('- ') && sections.length > 0) {
      sections[sections.length - 1].items.push(line.slice(2).trim())
    }
  }
  return sections
}
