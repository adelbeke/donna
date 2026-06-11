import { LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Filters from '../components/Filters/Filters'
import PRList from '../components/PRList/PRList'

export default function DashboardPage() {
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      {/* Top navbar */}
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/90 backdrop-blur-sm shadow-[0_1px_8px_0_rgba(0,0,0,0.4)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-sm font-semibold text-[var(--color-text-primary)] tracking-tight">
            Donna
          </h1>

          {user && (
            <div className="flex items-center gap-3">
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
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <Filters />
          <PRList />
        </div>
      </main>
    </div>
  )
}
