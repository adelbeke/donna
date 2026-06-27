import { useEffect, useState, useCallback } from 'react'
import { Terminal } from 'lucide-react'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { ghIsInstalled, ghGraphql } from '@/providers/electron'
import { VIEWER_QUERY } from '@/providers/github'
import { DashboardPage } from './DashboardPage.tsx'
import { FeaturesContext, type Feature } from '@/shared/features'
import type { GitHubUser } from '../types/github.ts'

const APP_FEATURES = new Set<Feature>(['branches'])

const tryNativeAuth = async (
  setToken: (t: string) => void,
  setUser: (u: GitHubUser) => void
): Promise<string | null> => {
  const installed = await ghIsInstalled()
  if (!installed) return 'gh CLI not found. Install it at cli.github.com then relaunch.'
  try {
    const res = await ghGraphql<{ viewer: GitHubUser }>(VIEWER_QUERY, {})
    const viewer = res.data.viewer
    setToken('gh-cli')
    setUser(viewer)
    return null
  } catch {
    return 'Not authenticated. Run `gh auth login` in your terminal then click Retry.'
  }
}

const AppAuthError = ({ message, onRetry }: { message: string; onRetry: () => void }) => {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center gap-4 p-8">
      <Terminal size={32} className="text-[var(--color-text-muted)]" />
      <p className="text-sm text-[var(--color-text-primary)] text-center max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="text-xs px-3 py-1.5 rounded bg-[var(--color-accent)] text-white cursor-pointer"
      >
        Retry
      </button>
    </div>
  )
}

export const AppContainer = () => {
  const { token, setToken, setUser } = useAuthStore()
  const [checking, setChecking] = useState(!token)
  const [error, setError] = useState<string | null>(null)

  const runAuth = useCallback(() => {
    setError(null)
    setChecking(true)
    tryNativeAuth(setToken, setUser)
      .then(setError)
      .finally(() => setChecking(false))
  }, [setToken, setUser])

  useEffect(() => {
    if (token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runAuth()
  }, [runAuth, token])

  if (checking) return null
  if (error) return <AppAuthError message={error} onRetry={runAuth} />
  return (
    <FeaturesContext.Provider value={APP_FEATURES}>
      <DashboardPage />
    </FeaturesContext.Provider>
  )
}
