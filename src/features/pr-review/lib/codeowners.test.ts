import { describe, it, expect } from 'vitest'
import { parseCodeowners, ownersFor } from './codeowners'

describe('parseCodeowners', () => {
  it('given comments and blank lines, then ignores them', () => {
    const text = '# top comment\n\n*.ts @alice\n  # indented comment\n'
    expect(parseCodeowners(text)).toEqual([{ pattern: '*.ts', owners: ['@alice'] }])
  })

  it('given a rule with multiple owners, then captures all of them', () => {
    const rules = parseCodeowners('src/ @alice @org/team bob@example.com')
    expect(rules).toEqual([
      { pattern: 'src/', owners: ['@alice', '@org/team', 'bob@example.com'] },
    ])
  })
})

describe('ownersFor', () => {
  it('given multiple matching rules, then the last one wins', () => {
    const rules = parseCodeowners('*.ts @alice\nsrc/special.ts @bob')
    expect(ownersFor('src/special.ts', rules)).toEqual(['@bob'])
    expect(ownersFor('src/other.ts', rules)).toEqual(['@alice'])
  })

  it('given an unanchored pattern, then it matches at any depth', () => {
    const rules = parseCodeowners('README.md @alice')
    expect(ownersFor('README.md', rules)).toEqual(['@alice'])
    expect(ownersFor('docs/README.md', rules)).toEqual(['@alice'])
  })

  it('given a root-anchored pattern, then it only matches at the repo root', () => {
    const rules = parseCodeowners('/README.md @alice')
    expect(ownersFor('README.md', rules)).toEqual(['@alice'])
    expect(ownersFor('docs/README.md', rules)).toEqual([])
  })

  it('given a directory pattern, then it matches everything under that directory but not the bare name', () => {
    const rules = parseCodeowners('docs/ @alice')
    expect(ownersFor('docs/readme.md', rules)).toEqual(['@alice'])
    expect(ownersFor('src/docs/guide.md', rules)).toEqual(['@alice'])
    expect(ownersFor('docs', rules)).toEqual([])
  })

  it('given a single star, then it does not cross a directory boundary', () => {
    const rules = parseCodeowners('src/*.ts @alice')
    expect(ownersFor('src/foo.ts', rules)).toEqual(['@alice'])
    expect(ownersFor('src/nested/foo.ts', rules)).toEqual([])
  })

  it('given a double star, then it crosses directory boundaries', () => {
    const rules = parseCodeowners('src/**/foo.ts @alice')
    expect(ownersFor('src/foo.ts', rules)).toEqual(['@alice'])
    expect(ownersFor('src/a/b/foo.ts', rules)).toEqual(['@alice'])
  })

  it('given a path matching no rule, then returns an empty array', () => {
    const rules = parseCodeowners('*.ts @alice')
    expect(ownersFor('README.md', rules)).toEqual([])
  })
})
