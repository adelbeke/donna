import { describe, it, expect } from 'vitest'
import { parseChangelogBody } from './parseChangelog'

describe('parseChangelogBody', () => {
  it('groups items under their preceding heading', () => {
    const body = [
      '### Features',
      '- add contribution links (#134) @adelbeke',
      '### Bug Fixes',
      '- retry worktree removal (#135) @adelbeke',
    ].join('\n')

    expect(parseChangelogBody(body)).toEqual([
      { heading: 'Features', items: ['add contribution links (#134) @adelbeke'] },
      { heading: 'Bug Fixes', items: ['retry worktree removal (#135) @adelbeke'] },
    ])
  })

  it('ignores unrecognized lines', () => {
    const body = '### Features\nsome preamble\n- add thing\n\n'
    expect(parseChangelogBody(body)).toEqual([{ heading: 'Features', items: ['add thing'] }])
  })

  it('ignores bullet lines before any heading', () => {
    expect(parseChangelogBody('- orphan item\n### Features\n- add thing')).toEqual([
      { heading: 'Features', items: ['add thing'] },
    ])
  })

  it('returns an empty array for empty body', () => {
    expect(parseChangelogBody('')).toEqual([])
  })

  it('returns an empty array for a null body', () => {
    expect(parseChangelogBody(null)).toEqual([])
  })
})
