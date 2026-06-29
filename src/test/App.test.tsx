import { render } from '@testing-library/react'
import App from '../App'

// Mock Supabase to avoid real network calls in tests
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}))

describe('App', () => {
  it('renders without crashing', () => {
    // App contains BrowserRouter + all route providers — just verify it mounts cleanly
    const { container } = render(<App />)
    expect(container).toBeTruthy()
  })
})
