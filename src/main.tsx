import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from '@/providers/AuthProvider'
import { QueryProvider } from '@/providers/QueryProvider'

/**
 * main.tsx — application entry point.
 *
 * Provider nesting order (outer → inner):
 *   QueryProvider (TanStack Query client)
 *     → AuthProvider (Supabase onAuthStateChange + loading state)
 *       → App (BrowserRouter + Routes)
 *
 * BrowserRouter is in App.tsx — NOT here (single BrowserRouter rule — Pitfall 4).
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>,
)
