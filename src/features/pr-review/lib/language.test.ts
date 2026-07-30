import { describe, it, expect } from 'vitest'
import { languageFor } from './language'

describe('languageFor', () => {
  it('given a known extension, then returns the mapped language', () => {
    expect(languageFor('src/foo.ts')).toBe('typescript')
    expect(languageFor('src/foo.tsx')).toBe('tsx')
  })

  it('given an unknown extension, then returns undefined', () => {
    expect(languageFor('image.rb')).toBeUndefined()
  })

  it('given a filename with no extension, then returns undefined', () => {
    expect(languageFor('Makefile')).toBeUndefined()
  })

  it('given a dotfile with no recognized extension, then returns undefined', () => {
    expect(languageFor('.gitignore')).toBeUndefined()
  })
})
