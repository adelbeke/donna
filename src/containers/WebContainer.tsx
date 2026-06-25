import { useAuthStore } from '../store/authStore.ts'
import AuthPage from '../pages/AuthPage.tsx'
import DashboardPage from '../pages/DashboardPage.tsx'

export function WebContainer() {
  const token = useAuthStore((s) => s.token)
  return token ? <DashboardPage /> : <AuthPage />
}
