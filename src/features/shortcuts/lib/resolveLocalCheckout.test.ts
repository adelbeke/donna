import { describe, it, expect } from 'vitest'
import { resolveLocalRepoPath } from './resolveLocalCheckout'

describe('resolveLocalRepoPath', () => {
  it('returns the path whose basename matches the repo name', () => {
    const result = resolveLocalRepoPath(['/Users/me/code/donna', '/Users/me/code/other'], 'donna')
    expect(result).toBe('/Users/me/code/donna')
  })

  it('returns null when no local path matches', () => {
    const result = resolveLocalRepoPath(['/Users/me/code/other'], 'donna')
    expect(result).toBeNull()
  })

  it('returns null for an empty list', () => {
    expect(resolveLocalRepoPath([], 'donna')).toBeNull()
  })
})
