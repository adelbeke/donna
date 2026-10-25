// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const workflow = readFileSync(new URL('./release.yml', import.meta.url), 'utf8')

describe('release workflow retries', () => {
  it('keeps the version-bump branch available after a failed job', () => {
    expect(workflow).not.toMatch(/git push[^\n]*--delete/)
    expect(workflow).not.toMatch(/^ {2}cleanup:/m)
  })

  it('uses the version-bump branch for both checkouts and the release PR', () => {
    expect(workflow.match(/ref: \$\{\{ needs\.bump\.outputs\.branch \}\}/g)).toHaveLength(2)
    expect(workflow).toContain('--head "${{ needs.bump.outputs.branch }}"')
  })
})
