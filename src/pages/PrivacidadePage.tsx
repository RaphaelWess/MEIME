import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

/**
 * PrivacidadePage — public LGPD-compliant privacy policy.
 *
 * No auth required — /privacidade is a top-level public route (not inside /app).
 * No BottomNav — public page, accessible before and after login.
 *
 * LGPD requirements addressed:
 * - What data is collected
 * - How it is stored and who can access it
 * - User right to request data deletion (art. 18 LGPD)
 * - Contact for data requests
 */
export default function PrivacidadePage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top bar with back button */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-zinc-200">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="px-3 py-2 min-h-[44px] text-zinc-700"
        >
          ← Voltar
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 py-6 max-w-prose">
        {/* Heading — 20px semibold per UI-SPEC Typography */}
        <h1 className="text-[20px] font-semibold leading-[1.2] text-zinc-900 mb-4">
          Política de Privacidade
        </h1>

        <p className="text-base text-zinc-600 leading-relaxed mb-4">
          <strong>Última atualização:</strong> junho de 2026
        </p>

        <section className="space-y-4 text-base text-zinc-700 leading-relaxed">
          <div>
            <h2 className="font-semibold text-zinc-900 mb-1">1. Dados coletados</h2>
            <p>
              O MEIME coleta apenas seu e-mail (para autenticação) e os dados financeiros que você
              registra voluntariamente no aplicativo, como receitas, despesas e agendamentos
              relacionados à sua atividade como MEI.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-zinc-900 mb-1">2. Como os dados são usados</h2>
            <p>
              Seus dados são usados exclusivamente para exibir suas informações financeiras dentro
              do aplicativo. O MEIME não compartilha, vende ou monetiza seus dados com terceiros.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-zinc-900 mb-1">3. Armazenamento e segurança</h2>
            <p>
              Seus dados são armazenados no Supabase, com servidores localizados na região da
              América do Sul (South America — São Paulo). O acesso aos dados é protegido por
              políticas de segurança em nível de linha (Row-Level Security), garantindo que apenas
              você, o titular da conta, possa visualizar ou modificar suas informações.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-zinc-900 mb-1">4. Exclusão de dados (art. 18 LGPD)</h2>
            <p>
              Você pode solicitar a exclusão completa da sua conta e de todos os dados associados a
              qualquer momento. Para isso, acesse{' '}
              <strong>Minha Conta → Zona de Perigo → Excluir minha conta</strong>. A exclusão é
              permanente e irreversível.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-zinc-900 mb-1">5. Contato</h2>
            <p>
              Para dúvidas sobre privacidade, solicitações de dados ou qualquer questão relacionada
              à Lei Geral de Proteção de Dados (LGPD), entre em contato pelo e-mail:{' '}
              <a
                href="mailto:raphaelwbarbosa@gmail.com"
                className="text-green-600 underline underline-offset-2"
              >
                raphaelwbarbosa@gmail.com
              </a>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
