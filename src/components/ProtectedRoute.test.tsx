import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import ProtectedRoute from './ProtectedRoute'

// Mock useAuthStore so we can control user and loading state in tests
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}))

import { useAuthStore } from '@/stores/auth.store'

const mockUseAuthStore = vi.mocked(useAuthStore)

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /welcome when user is null and loading is false', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: false,
      setUser: vi.fn(),
      setLoading: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/app']}>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    // Should NOT render protected content
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders children when user is non-null and loading is false', () => {
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' } as any,
      loading: false,
      setUser: vi.fn(),
      setLoading: vi.fn(),
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('renders loading indicator and does NOT redirect when loading is true', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: true,
      setUser: vi.fn(),
      setLoading: vi.fn(),
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    // Should show loading indicator
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
    // Should NOT render protected content
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })
})
