import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from '@/providers/AuthProvider'
import { EmpresaProvider } from '@/providers/EmpresaProvider'
import { QueryProvider } from '@/providers/QueryProvider'

/**
 * main.tsx — application entry point.
 *
 * Provider nesting order (outer → inner):
 *   QueryProvider (TanStack Query client)
 *     → AuthProvider (Supabase onAuthStateChange + auth loading state)
 *       → EmpresaProvider (boot-time empresa_mei hydration — depends on AuthProvider)
 *         → App (BrowserRouter + Routes)
 *
 * EmpresaProvider MUST be inside AuthProvider — it reads user/authLoading from auth store.
 * BrowserRouter is in App.tsx — NOT here (single BrowserRouter rule — Pitfall 4).
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <EmpresaProvider>
          <App />
        </EmpresaProvider>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>,
)
