import { useState } from 'react'
import { LogOut, Search, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { usePRStore } from '../store/prStore'
import { IS_ELECTRON } from '../lib/electron'
import Filters from '../components/Filters/Filters'
import PRList from '../components/PRList/PRList'
import BranchList from '../components/BranchList/BranchList'
import Footer from '../components/Footer/Footer'
import { useUpdateCheck, isNewer } from '../hooks/useUpdateCheck'

function UpdateBanner({ version }: { version: string }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="flex items-center justify-between px-4 py-2 text-xs bg-[var(--color-accent)] text-white">
      <span>Version {version} is available.</span>
      <span className="flex items-center gap-3">
        <a href="https://github.com/adelbeke/donna/releases/latest" target="_blank" rel="noopener noreferrer" className="underline">Download</a>
        <button onClick={() => setDismissed(true)}>✕</button>
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const { filters, setFilters, view, setView } = usePRStore()
  const { data: latestVersion } = useUpdateCheck()
  const showBanner = latestVersion && isNewer(latestVersion, __APP_VERSION__)

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] flex flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/90 backdrop-blur-sm shadow-[0_1px_8px_0_rgba(0,0,0,0.4)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 shrink-0">
            <h1 className="text-sm font-semibold text-[var(--color-text-primary)] tracking-tight">
              Donna
            </h1>
          </div>

          <div className="flex items-center gap-1 shrink-0">
              {(['prs', ...(IS_ELECTRON ? ['branches' as const] : [])] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer
                    ${view === v
                      ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]'
                    }`}>
                  {v === 'prs' ? 'Pull Requests' : 'Branches'}
                </button>
              ))}
            </div>

          <div className="relative flex-1 max-w-sm mx-auto">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder={view === 'branches' ? 'Filter by branch…' : 'Filter by title…'}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md pl-7 pr-7 py-1.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors"
            />
            {filters.search && (
              <button
                onClick={() => setFilters({ search: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-3 shrink-0">
              <img
                src={user.avatarUrl}
                alt={user.login}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-xs text-[var(--color-text-secondary)]">
                {user.login}
              </span>
              {!IS_ELECTRON && (
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

      {showBanner && <UpdateBanner version={latestVersion} />}

      {/* Main layout */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full">
        {view === 'branches'
          ? <BranchList />
          : (
            <div className="flex gap-8">
              <Filters />
              <PRList />
            </div>
          )
        }
      </main>
      <Footer />
    </div>
  )
}
