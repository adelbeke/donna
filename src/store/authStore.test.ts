import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'

const user = { login: 'alice', avatarUrl: 'https://example.com/alice.png', name: 'Alice' }

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null, sessionExpired: false })
})

describe('authStore', () => {
  it('setToken sets token and clears sessionExpired', () => {
    useAuthStore.setState({ sessionExpired: true })
    useAuthStore.getState().setToken('tok123')
    const state = useAuthStore.getState()
    expect(state.token).toBe('tok123')
    expect(state.sessionExpired).toBe(false)
  })

  it('setUser sets user object', () => {
    useAuthStore.getState().setUser(user)
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('logout clears token, user, and sessionExpired', () => {
    useAuthStore.setState({ token: 'tok', user, sessionExpired: true })
    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.sessionExpired).toBe(false)
  })

  it('expireSession sets sessionExpired true and clears token and user', () => {
    useAuthStore.setState({ token: 'tok', user })
    useAuthStore.getState().expireSession()
    const state = useAuthStore.getState()
    expect(state.sessionExpired).toBe(true)
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
  })
})
