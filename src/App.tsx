import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { isAuthError } from './lib/github'
import { IS_NATIVE } from './lib/electron'
import { AppContainer } from './containers/AppContainer.tsx'
import { WebContainer } from './containers/WebContainer.tsx'

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {IS_NATIVE ? <AppContainer /> : <WebContainer />}
    </QueryClientProvider>
  )
}
