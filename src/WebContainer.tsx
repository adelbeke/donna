import { useAuthStore } from './store/authStore'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'

export function WebContainer() {
  const token = useAuthStore((s) => s.token)
  return token ? <DashboardPage /> : <AuthPage />
}
