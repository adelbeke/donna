import type { Language } from 'prism-react-renderer'

// ponytail: prism-react-renderer only bundles ~30 languages — ruby, rust, java, php fall back to
// plain text. Add `prismjs/components/prism-*` imports if a language actually gets missed.
const EXTENSION_TO_LANGUAGE: Record<string, Language> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  json: 'json',
  css: 'css',
  scss: 'scss',
  html: 'markup',
  md: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
  py: 'python',
  go: 'go',
  sql: 'sql',
  graphql: 'graphql',
  sh: 'bash',
}

export const languageFor = (filename: string): Language | undefined => {
  const ext = filename.split('.').pop()
  if (!ext || ext === filename) return undefined
  return EXTENSION_TO_LANGUAGE[ext.toLowerCase()]
}
