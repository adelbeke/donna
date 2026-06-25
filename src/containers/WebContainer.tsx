import { useAuthStore } from '@/features/auth/stores/authStore'
import { AuthPage } from '@/features/auth/exports'
import DashboardPage from '../pages/DashboardPage.tsx'

export function WebContainer() {
  const token = useAuthStore((s) => s.token)
  return token ? <DashboardPage /> : <AuthPage />
}
