import { LogOut, Moon, Sun } from 'lucide-react'
import { useAuthStore } from '@/features/auth/exports'
import { usePRStore, PRDashboard } from '@/features/pull-requests/exports'
import { useTheme } from '@/shared/hooks/useTheme'
import { useFeatures } from '@/shared/features'
import { BranchDashboard } from '@/features/branches/exports'
import { Footer } from '@/shared/components/Footer/Footer'
import { useUpdateCheck, UpdateBanner } from '@/features/updates/exports'

export const DashboardPage = () => {
  const { user, logout } = useAuthStore()
  // TODO: the view shouldn't be drove by the PR store feature
  const { view, setView } = usePRStore()
  const { data: latestVersion } = useUpdateCheck()
  const { theme, toggle } = useTheme()
  const features = useFeatures()

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] flex flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/90 backdrop-blur-sm px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-[var(--color-text-primary)] tracking-tight">
              Donna
            </h1>

            <div className="flex items-center gap-1 shrink-0">
              {(['prs', ...(features.has('branches') ? ['branches' as const] : [])] as const).map(
                (v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer
                    ${
                      view === v
                        ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]'
                    }`}
                  >
                    {v === 'prs' ? 'Pull Requests' : 'Branches'}
                  </button>
                )
              )}
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3 shrink-0">
              <img src={user.avatarUrl} alt={user.login} className="w-6 h-6 rounded-full" />
              <span className="text-xs text-[var(--color-text-secondary)]">{user.login}</span>
              <button
                onClick={toggle}
                title="Toggle theme"
                className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              {!features.has('branches') && (
                <button
                  onClick={logout}
                  title="Disconnect"
                  className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {latestVersion && <UpdateBanner version={latestVersion} />}

      {/* Main layout */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full">
        {view === 'branches' ? <BranchDashboard /> : <PRDashboard />}
      </main>
      <Footer />
    </div>
  )
}
