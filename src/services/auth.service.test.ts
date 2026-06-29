import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase module BEFORE importing the service
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    rpc: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { authService } from './auth.service'

const mockSupabase = supabase as {
  auth: {
    signInWithPassword: ReturnType<typeof vi.fn>
    signUp: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
  }
  rpc: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('authService.signIn', () => {
  it('calls supabase.auth.signInWithPassword with email and password', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null })

    await authService.signIn('test@example.com', 'password123')

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })
})

describe('authService.signUp', () => {
  it('calls supabase.auth.signUp with email and password', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ data: {}, error: null })

    await authService.signUp('new@example.com', 'securepass')

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'securepass',
    })
  })
})

describe('authService.signOut', () => {
  it('calls supabase.auth.signOut()', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    await authService.signOut()

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })
})

describe('authService.deleteAccount', () => {
  it('calls supabase.rpc("delete_user") then supabase.auth.signOut()', async () => {
    mockSupabase.rpc.mockResolvedValue({ error: null })
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    await authService.deleteAccount()

    expect(mockSupabase.rpc).toHaveBeenCalledWith('delete_user')
    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('does not throw if signOut fails after deletion (graceful error handling)', async () => {
    mockSupabase.rpc.mockResolvedValue({ error: null })
    mockSupabase.auth.signOut.mockRejectedValue(new Error('network error'))

    // Should NOT throw even when signOut fails
    await expect(authService.deleteAccount()).resolves.not.toThrow()
  })
})
