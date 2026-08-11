import { LogOut, Moon, Sun } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { useAuthStore } from '@/features/auth/exports'
import { useTheme } from '@/shared/hooks/useTheme'
import { useFeatures, type Feature } from '@/shared/features'
import { Footer } from '@/shared/components/Footer/Footer'
import { useUpdateCheck, UpdateBanner } from '@/features/updates/exports'
import { OnboardingGuide } from '@/features/onboarding/exports'

const NAV_TABS: { to: string; label: string; feature?: Feature }[] = [
  { to: '/prs', label: 'Pull Requests' },
  { to: '/branches', label: 'Branches', feature: 'branches' },
]

export const AppLayout = () => {
  const { user, logout } = useAuthStore()
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
              {NAV_TABS.filter((t) => !t.feature || features.has(t.feature)).map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  className={({ isActive }) =>
                    `text-xs px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer
                    ${
                      isActive
                        ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]'
                    }`
                  }
                >
                  {t.label}
                </NavLink>
              ))}
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3 shrink-0">
              <img src={user.avatarUrl} alt={user.login} className="w-6 h-6 rounded-full" />
              <span className="text-xs text-[var(--color-text-secondary)]">{user.login}</span>
              <OnboardingGuide />
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
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
