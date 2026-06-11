import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { isAuthError } from './lib/github'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'

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

function AppContent() {
  const token = useAuthStore((s) => s.token)
  return token ? <DashboardPage /> : <AuthPage />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
