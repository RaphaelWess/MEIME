import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authService } from '@/services/auth.service'

type Tab = 'login' | 'register'

/**
 * AuthPage — email+password login and registration.
 *
 * D-11: Only calls authService — never imports Supabase directly.
 * D-03: Footer contains /privacidade link (second location).
 *
 * Error messages per UI-SPEC Copywriting Contract:
 * - Invalid credentials: "E-mail ou senha incorretos. Tente novamente."
 * - Network error: "Sem conexão. Verifique sua internet e tente de novo."
 * - Generic: "Algo deu errado. Tente novamente em instantes."
 */
export default function AuthPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const classifyError = (err: unknown): string => {
    if (!navigator.onLine) {
      return 'Sem conexão. Verifique sua internet e tente de novo.'
    }
    const message = err instanceof Error ? err.message.toLowerCase() : ''
    if (
      message.includes('invalid login credentials') ||
      message.includes('invalid credentials') ||
      message.includes('email not confirmed') ||
      message.includes('wrong password')
    ) {
      return 'E-mail ou senha incorretos. Tente novamente.'
    }
    return 'Algo deu errado. Tente novamente em instantes.'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: authError } = await authService.signIn(email, password)
      if (authError) throw authError
      navigate('/app')
    } catch (err) {
      setError(classifyError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: authError } = await authService.signUp(email, password)
      if (authError) throw authError
      navigate('/app')
    } catch (err) {
      setError(classifyError(err))
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    setError(null)
    setEmail('')
    setPassword('')
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header area */}
      <div className="flex flex-col items-center pt-12 pb-6 px-6">
        <h1 className="text-[20px] font-semibold leading-[1.2] text-zinc-900">
          {activeTab === 'login' ? 'Entrar no MEIME' : 'Criar sua conta'}
        </h1>
        <p className="text-base text-zinc-500 mt-1">Gestão gratuita para MEI</p>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-zinc-200 mx-6">
        <button
          type="button"
          onClick={() => switchTab('login')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'login'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => switchTab('register')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'register'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Criar conta
        </button>
      </div>

      {/* Form area */}
      <main className="flex-1 px-6 pt-6">
        {/* Error alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Login form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-email">E-mail</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                className="min-h-[44px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-password">Senha</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                autoComplete="current-password"
                className="min-h-[44px]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold min-h-[44px] mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        )}

        {/* Register form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="register-email">E-mail</Label>
              <Input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                className="min-h-[44px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="register-password">Senha</Label>
              <Input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                autoComplete="new-password"
                className="min-h-[44px]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold min-h-[44px] mt-2"
            >
              {loading ? 'Criando conta...' : 'Criar minha conta'}
            </Button>
          </form>
        )}
      </main>

      {/* Footer — privacy link (D-03, second location) */}
      <footer className="flex justify-center py-6 px-6">
        <Link
          to="/privacidade"
          className="text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
        >
          Privacidade
        </Link>
      </footer>
    </div>
  )
}
