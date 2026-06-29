import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

/**
 * QueryProvider — wraps the app with TanStack QueryClient.
 * QueryClient is instantiated inside the component (not at module level)
 * to avoid shared state across tests and SSR environments.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes — avoids excessive refetches for Supabase data
        retry: 1,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
