import { describe, it, expect } from 'vitest'
import { ClientError } from 'graphql-request'
import { isAuthError } from './github'

function makeClientError(opts: {
  status?: number
  errors?: Array<{ type?: string; message?: string }>
}): ClientError {
  const error = Object.create(ClientError.prototype) as ClientError
  Object.assign(error, {
    response: {
      status: opts.status ?? 200,
      errors: opts.errors ?? [],
    },
  })
  return error
}

describe('isAuthError', () => {
  it('GIVEN status 401 WHEN called THEN returns true', () => {
    expect(isAuthError(makeClientError({ status: 401 }))).toBe(true)
  })

  it('GIVEN status 403 WHEN called THEN returns true', () => {
    expect(isAuthError(makeClientError({ status: 403 }))).toBe(true)
  })

  it('GIVEN error type FORBIDDEN WHEN called THEN returns true', () => {
    expect(isAuthError(makeClientError({ errors: [{ type: 'FORBIDDEN' }] }))).toBe(true)
  })

  it('GIVEN error message Bad credentials WHEN called THEN returns true', () => {
    expect(isAuthError(makeClientError({ errors: [{ message: 'Bad credentials' }] }))).toBe(true)
  })

  it('GIVEN unrelated ClientError WHEN called THEN returns false', () => {
    expect(isAuthError(makeClientError({ status: 500 }))).toBe(false)
  })

  it('GIVEN non-ClientError WHEN called THEN returns false', () => {
    expect(isAuthError(new Error('network error'))).toBe(false)
  })

  it('GIVEN null WHEN called THEN returns false', () => {
    expect(isAuthError(null)).toBe(false)
  })
})
