import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { isAuthError } from './providers/github'
import { AppContainer } from './containers/AppContainer.tsx'

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContainer />
  </QueryClientProvider>
)
export default App
