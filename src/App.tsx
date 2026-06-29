import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import WelcomePage from '@/pages/WelcomePage'
import AuthPage from '@/pages/AuthPage'
import PrivacidadePage from '@/pages/PrivacidadePage'
import AppShell from '@/components/AppShell'
import ProtectedRoute from '@/components/ProtectedRoute'
import InicioTab from '@/pages/InicioTab'
import FinancasTab from '@/pages/FinancasTab'
import AgendaTab from '@/pages/AgendaTab'
import CobrarTab from '@/pages/CobrarTab'
import ContaTab from '@/pages/ContaTab'

/**
 * App — full React Router declarative route tree.
 *
 * Public routes: /welcome, /auth, /privacidade
 * Protected routes: /app/* (guarded by ProtectedRoute)
 *
 * IMPORTANT: BrowserRouter lives here — NOT in main.tsx (single BrowserRouter — Pitfall 4).
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/privacidade" element={<PrivacidadePage />} />

        {/* Protected routes — ProtectedRoute guards AppShell and all children */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<InicioTab />} />
          <Route path="financas" element={<FinancasTab />} />
          <Route path="agenda" element={<AgendaTab />} />
          <Route path="cobrar" element={<CobrarTab />} />
          <Route path="conta" element={<ContaTab />} />
        </Route>

        {/* Catch-all: redirect unknown paths to /welcome */}
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
