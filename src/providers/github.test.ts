import { describe, it, expect } from 'vitest'
import { ClientError } from 'graphql-request'
import { isAuthError } from './github'

function makeClientError(opts: {
  status?: number
  errors?: { type?: string; message?: string }[]
}): ClientError {
  const err = Object.create(ClientError.prototype) as ClientError
  Object.assign(err, {
    name: 'ClientError',
    message: 'error',
    response: { status: opts.status ?? 200, errors: opts.errors ?? [], data: null, headers: {} },
    request: { query: '', variables: {} },
  })
  return err
}

describe('isAuthError', () => {
  it('returns true for 401', () => {
    expect(isAuthError(makeClientError({ status: 401 }))).toBe(true)
  })

  it('returns true for 403', () => {
    expect(isAuthError(makeClientError({ status: 403 }))).toBe(true)
  })

  it('returns false for 500', () => {
    expect(isAuthError(makeClientError({ status: 500 }))).toBe(false)
  })

  it('returns true for FORBIDDEN error type', () => {
    expect(isAuthError(makeClientError({ errors: [{ type: 'FORBIDDEN' }] }))).toBe(true)
  })

  it('returns true for bad credentials message', () => {
    expect(isAuthError(makeClientError({ errors: [{ message: 'Bad credentials' }] }))).toBe(true)
  })

  it('returns false for non-auth ClientError', () => {
    expect(isAuthError(makeClientError({ status: 200, errors: [{ message: 'not found' }] }))).toBe(
      false
    )
  })

  it('returns false for non-ClientError', () => {
    expect(isAuthError(new Error('something'))).toBe(false)
    expect(isAuthError(null)).toBe(false)
    expect(isAuthError('string error')).toBe(false)
  })
})
