import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuthStore } from '@/stores/auth.store'
import { useEmpresaStore } from '@/stores/empresa.store'
import { authService } from '@/services/auth.service'
import { formatCnpj } from '@/utils/cnpj'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

/**
 * ContaTab — authenticated user account page.
 *
 * Features:
 * - User avatar + email header
 * - Política de Privacidade link (D-03 — second location; first is WelcomePage/AuthPage footer)
 * - Logout button (calls authService.signOut() — D-11)
 * - Zona de Perigo: delete account with AlertDialog confirmation (T-1-04, LGPD DoD-6)
 *   AlertDialogCancel is Radix default focus (safe action) — no extra autoFocus needed
 */
export default function ContaTab() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const empresa = useEmpresaStore((s) => s.empresa)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const userInitial = user?.email?.[0]?.toUpperCase() ?? '?'

  async function handleSignOut() {
    await authService.signOut()
    navigate('/welcome')
  }

  async function handleDeleteAccount() {
    setDeleteError(null)
    try {
      await authService.deleteAccount()
      navigate('/welcome')
    } catch {
      setDeleteError('Algo deu errado. Tente novamente em instantes.')
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      {/* Header: avatar + email */}
      <div className="flex items-center gap-4 pb-6">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="text-lg font-semibold bg-green-100 text-green-700">
            {userInitial}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-base font-semibold text-zinc-900 leading-tight">
            {user?.email ?? ''}
          </p>
          <p className="text-sm text-zinc-500 mt-0.5">Minha Conta</p>
        </div>
      </div>

      <Separator />

      {/* Minha empresa — dados da empresa MEI (defensive guard: ProtectedRoute guarantees empresa exists) */}
      {empresa && (
        <>
          <div className="py-4 space-y-3">
            <p className="text-sm font-semibold text-zinc-700">Minha empresa</p>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-900">{empresa.razao_social}</p>
              <p className="text-sm text-zinc-500">CNPJ: {formatCnpj(empresa.cnpj ?? '')}</p>
              {empresa.atividade_principal && (
                <p className="text-sm text-zinc-500">{empresa.atividade_principal}</p>
              )}
              {empresa.data_abertura_mei && (
                <p className="text-sm text-zinc-500">
                  Abertura:{' '}
                  {new Date(empresa.data_abertura_mei + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/conta/empresa')}
            >
              Editar dados da empresa
            </Button>
          </div>

          <Separator />
        </>
      )}

      {/* Privacy link (D-03 — second location after Welcome/Auth footer) */}
      <div className="py-4">
        <Link
          to="/privacidade"
          className="text-sm text-green-600 hover:underline"
        >
          Política de Privacidade
        </Link>
      </div>

      <Separator />

      {/* Logout */}
      <div className="py-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
        >
          Sair
        </Button>
      </div>

      <Separator />

      {/* Zona de Perigo */}
      <div className="pt-4">
        <p className="text-sm font-semibold text-red-600 mb-3">Zona de Perigo</p>

        {deleteError && (
          <p className="mb-3 text-sm text-red-600" role="alert">
            {deleteError}
          </p>
        )}

        <AlertDialog>
          <AlertDialogTrigger
            className="inline-flex w-full items-center justify-center rounded-md border border-red-300 bg-background px-4 py-2 text-sm font-medium text-red-600 ring-offset-background transition-colors hover:bg-red-50 hover:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Excluir minha conta
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Todos os seus dados serão apagados permanentemente. Esta ação
                não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {/* Cancel is Radix AlertDialog default focus — satisfies UI-SPEC safe-action requirement */}
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeleteAccount}
              >
                Sim, excluir minha conta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
