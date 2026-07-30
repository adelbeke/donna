export type CodeownersRule = { pattern: string; owners: string[] }

export const parseCodeowners = (text: string): CodeownersRule[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      const [pattern, ...owners] = line.split(/\s+/)
      return { pattern, owners }
    })

// Placeholders for the multi-char `**` forms, swapped in before the plain `*` pass runs
// (otherwise that pass would mangle the `**` sequences it should treat specially). Patterns
// never contain whitespace (parseCodeowners splits tokens on it), so these are safe markers.
const DOUBLE_STAR_SLASH = '\t0\t'
const SLASH_DOUBLE_STAR = '\t1\t'
const DOUBLE_STAR = '\t2\t'

// ponytail: hand-rolled glob → RegExp. `minimatch` doesn't implement gitignore anchoring, so a
// dependency wouldn't save the tricky part. Character classes ([abc], ?) are not supported —
// GitHub allows them but they're vanishingly rare in real CODEOWNERS files.
const globToRegexSource = (pattern: string): string => {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  return escaped
    .replaceAll('**/', DOUBLE_STAR_SLASH)
    .replaceAll('/**', SLASH_DOUBLE_STAR)
    .replaceAll('**', DOUBLE_STAR)
    .replaceAll('*', '[^/]*')
    .replaceAll(DOUBLE_STAR_SLASH, '(?:.*/)?')
    .replaceAll(SLASH_DOUBLE_STAR, '(?:/.*)?')
    .replaceAll(DOUBLE_STAR, '.*')
}

const patternToRegex = (rawPattern: string): RegExp => {
  let pattern = rawPattern
  const dirOnly = pattern.endsWith('/')
  if (dirOnly) pattern = pattern.slice(0, -1)
  const explicitlyAnchored = pattern.startsWith('/')
  if (explicitlyAnchored) pattern = pattern.slice(1)
  const anchored = explicitlyAnchored || pattern.includes('/')

  const prefix = anchored ? '^' : '^(?:.*/)?'
  const suffix = dirOnly ? '/.*$' : '(?:/.*)?$'
  return new RegExp(prefix + globToRegexSource(pattern) + suffix)
}

// CODEOWNERS semantics: the last matching rule in file order wins, not the first (or most specific).
export const ownersFor = (path: string, rules: CodeownersRule[]): string[] => {
  let owners: string[] = []
  for (const rule of rules) {
    if (patternToRegex(rule.pattern).test(path)) owners = rule.owners
  }
  return owners
}
