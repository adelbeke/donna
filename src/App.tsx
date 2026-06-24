import { useEffect, useState, useCallback } from 'react'
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { Terminal } from 'lucide-react'
import { useAuthStore } from './store/authStore'
import { isAuthError, VIEWER_QUERY } from './lib/github'
import { IS_ELECTRON } from './lib/electron'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import type { GitHubUser } from './types/github'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isAuthError(error)) useAuthStore.getState().expireSession()
    },
  }),
  defaultOptions: {
    queries: {
      retry: (count, err) => !isAuthError(err) && count < 1,
      refetchOnWindowFocus: false,
    },
  },
})

function ElectronAuthError({ message, onRetry }: { message: string; onRetry: () => void }) {
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

async function tryElectronAuth(
  setToken: (t: string) => void,
  setUser: (u: GitHubUser) => void,
): Promise<string | null> {
  const installed = await window.electronAPI!.gh.isInstalled()
  if (!installed) return 'gh CLI not found. Install it at cli.github.com then relaunch.'
  try {
    const res = await window.electronAPI!.gh.graphql(VIEWER_QUERY, {})
    const viewer = (res.data as { viewer: GitHubUser }).viewer
    setToken('gh-cli')
    setUser(viewer)
    return null
  } catch {
    return 'Not authenticated. Run `gh auth login` in your terminal then click Retry.'
  }
}

function AppContent() {
  const { token, setToken, setUser } = useAuthStore()
  const [ghChecking, setGhChecking] = useState(() => IS_ELECTRON && !token)
  const [ghError, setGhError] = useState<string | null>(null)

  const runElectronAuth = useCallback(() => {
    setGhError(null)
    setGhChecking(true)
    tryElectronAuth(setToken, setUser)
      .then(setGhError)
      .finally(() => setGhChecking(false))
  }, [setToken, setUser])

  useEffect(() => {
    if (!IS_ELECTRON || token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runElectronAuth()
  // ponytail: run once; token excluded so re-auth on next open uses cached token
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (ghChecking) return null

  if (IS_ELECTRON) {
    if (ghError) return <ElectronAuthError message={ghError} onRetry={runElectronAuth} />
    return <DashboardPage />
  }

  return token ? <DashboardPage /> : <AuthPage />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
