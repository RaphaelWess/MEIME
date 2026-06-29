import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import ProtectedRoute from './ProtectedRoute'

// Mock useAuthStore so we can control user and loading state in tests
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}))

// Mock useEmpresaStore — ProtectedRoute now gates on both auth and empresa loading
vi.mock('@/stores/empresa.store', () => ({
  useEmpresaStore: vi.fn(),
}))

import { useAuthStore } from '@/stores/auth.store'
import { useEmpresaStore } from '@/stores/empresa.store'

const mockUseAuthStore = vi.mocked(useAuthStore)
const mockUseEmpresaStore = vi.mocked(useEmpresaStore)

// Helper: default both stores to resolved/authenticated + empresa present
function setAuthResolved(user: object | null = { id: 'user-123', email: 'test@example.com' }) {
  mockUseAuthStore.mockReturnValue({
    user: user as any,
    loading: false,
    setUser: vi.fn(),
    setLoading: vi.fn(),
  })
}

function setEmpresaResolved(empresa: object | null = { id: 'emp-1', user_id: 'user-123' }) {
  mockUseEmpresaStore.mockReturnValue({
    empresa: empresa as any,
    loading: false,
    setEmpresa: vi.fn(),
    setLoading: vi.fn(),
  })
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /welcome when user is null and both stores resolved', () => {
    setAuthResolved(null)
    setEmpresaResolved(null)

    render(
      <MemoryRouter initialEntries={['/app']}>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    // Should NOT render protected content — redirected to /welcome
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders children when user is non-null and empresa is non-null', () => {
    setAuthResolved()
    setEmpresaResolved()

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('renders loading indicator when authLoading is true', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: true,
      setUser: vi.fn(),
      setLoading: vi.fn(),
    })
    setEmpresaResolved(null)

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders loading indicator when empresaLoading is true', () => {
    setAuthResolved()
    mockUseEmpresaStore.mockReturnValue({
      empresa: null,
      loading: true,
      setEmpresa: vi.fn(),
      setLoading: vi.fn(),
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('redirects to /onboarding when user is non-null but empresa is null', () => {
    setAuthResolved()
    setEmpresaResolved(null)

    render(
      <MemoryRouter initialEntries={['/app']}>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    // Should NOT render protected content — redirected to /onboarding
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })
})
