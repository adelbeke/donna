import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createGitHubClient, VIEWER_QUERY } from '../lib/github'
import { useAuthStore } from '../store/authStore'
import type { GitHubUser } from '../types/github'
import Footer from '../components/Footer/Footer'

interface ViewerResult {
  viewer: GitHubUser
}

export default function AuthPage() {
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { setToken: saveToken, setUser, sessionExpired } = useAuthStore()
  const queryClient = useQueryClient()

  async function handleConnect() {
    if (!token.trim()) return
    setLoading(true)
    setError(null)
    try {
      const client = createGitHubClient(token.trim())
      const data = await client.request<ViewerResult>(VIEWER_QUERY)
      saveToken(token.trim())
      setUser(data.viewer)
      queryClient.invalidateQueries()
    } catch {
      setError('Invalid token or network error. Make sure it has repo and read:org scopes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] tracking-tight">
            Donna
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Your PR assistant
          </p>
        </div>

        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="token"
              className="block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider"
            >
              Personal Access Token
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              placeholder="github_pat_..."
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          {(error || (sessionExpired && !error)) && (
            <p className="text-xs text-[var(--color-danger)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger)] rounded px-3 py-2">
              {error ?? 'Your session expired or the token was revoked. Please reconnect with a valid token.'}
            </p>
          )}

          <button
            onClick={handleConnect}
            disabled={loading || !token.trim()}
            className="w-full bg-[var(--color-accent)] hover:opacity-90 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-md transition-opacity cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting…' : 'Connect'}
          </button>

          <p className="text-xs text-[var(--color-text-muted)] text-center">
            Your token is stored locally and never sent to any server.{' '}
            <a
              href="https://github.com/settings/tokens/new?scopes=repo,read:org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline"
            >
              Generate one →
            </a>
          </p>
          <p className="text-xs text-[var(--color-text-muted)] text-center">
            Using an organization with SSO?{' '}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline"
            >
              Authorize the token for SSO
            </a>{' '}
            after generating it.
          </p>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  )
}
