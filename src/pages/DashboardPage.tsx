import { LogOut, Search, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { usePRStore } from '../store/prStore'
import Filters from '../components/Filters/Filters'
import PRList from '../components/PRList/PRList'
import Footer from '../components/Footer/Footer'

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const { filters, setFilters } = usePRStore()

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

          <div className="relative flex-1 max-w-sm mx-auto">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Filter by title…"
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
              <button
                onClick={logout}
                title="Disconnect"
                className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main layout */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full">
        <div className="flex gap-8">
          <Filters />
          <PRList />
        </div>
      </main>
      <Footer />
    </div>
  )
}
