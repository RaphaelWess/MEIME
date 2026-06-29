import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useEmpresaStore } from '@/stores/empresa.store'
import { useAuthStore } from '@/stores/auth.store'
import { empresaService } from '@/services/empresa.service'
import { formatCnpj } from '@/utils/cnpj'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * EmpresaEditPage — edit mutable empresa MEI fields inside the /app shell.
 *
 * Read-only: cnpj, razao_social (from Receita Federal, immutable).
 * Editable: atividade_principal, data_abertura_mei, is_caminhoneiro.
 *
 * Data source: useEmpresaStore() — hydrated by EmpresaProvider at boot (D-11).
 * Never fetches from Supabase directly.
 */
export default function EmpresaEditPage() {
  const navigate = useNavigate()
  const empresa = useEmpresaStore((s) => s.empresa)
  const setEmpresa = useEmpresaStore((s) => s.setEmpresa)
  const user = useAuthStore((s) => s.user)

  const [atividadePrincipal, setAtividadePrincipal] = useState(
    empresa?.atividade_principal ?? ''
  )
  const [dataAberturaEmei, setDataAberturaEmei] = useState(
    empresa?.data_abertura_mei ?? ''
  )
  const [isCaminhoneiro, setIsCaminhoneiro] = useState(
    empresa?.is_caminhoneiro ?? false
  )
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSave() {
    if (!empresa || !user) return

    setSaving(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    try {
      const result = await empresaService.save({
        user_id: user.id,
        cnpj: empresa.cnpj,
        razao_social: empresa.razao_social,
        nome_fantasia: empresa.nome_fantasia,
        cnae_fiscal: empresa.cnae_fiscal,
        cnae_fiscal_descricao: empresa.cnae_fiscal_descricao,
        situacao_cadastral: empresa.situacao_cadastral,
        data_inicio_atividade: empresa.data_inicio_atividade,
        atividade_principal: atividadePrincipal,
        data_abertura_mei: dataAberturaEmei || null,
        is_caminhoneiro: isCaminhoneiro,
      })
      setEmpresa(result)
      setSuccessMsg('Dados salvos')
    } catch {
      setErrorMsg('Não foi possível salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">
        Dados da empresa
      </h1>

      <div className="space-y-5">
        {/* CNPJ — read-only */}
        <div className="space-y-1.5">
          <Label htmlFor="cnpj" className="text-sm text-zinc-600">
            CNPJ
          </Label>
          <Input
            id="cnpj"
            readOnly
            value={formatCnpj(empresa?.cnpj ?? '')}
            className="bg-zinc-50 text-zinc-500 cursor-default"
          />
        </div>

        {/* Razão social — read-only */}
        <div className="space-y-1.5">
          <Label htmlFor="razao-social" className="text-sm text-zinc-600">
            Razão social
          </Label>
          <Input
            id="razao-social"
            readOnly
            value={empresa?.razao_social ?? ''}
            className="bg-zinc-50 text-zinc-500 cursor-default"
          />
        </div>

        {/* Atividade principal — editable */}
        <div className="space-y-1.5">
          <Label htmlFor="atividade-principal" className="text-sm text-zinc-600">
            Atividade principal
          </Label>
          <Input
            id="atividade-principal"
            value={atividadePrincipal}
            onChange={(e) => setAtividadePrincipal(e.target.value)}
            placeholder="Ex.: Comércio varejista de artigos de vestuário"
          />
        </div>

        {/* Data de abertura do MEI — editable */}
        <div className="space-y-1.5">
          <Label htmlFor="data-abertura" className="text-sm text-zinc-600">
            Data de abertura do MEI
          </Label>
          <Input
            id="data-abertura"
            type="date"
            value={dataAberturaEmei ?? ''}
            onChange={(e) => setDataAberturaEmei(e.target.value)}
          />
        </div>

        {/* Is caminhoneiro — checkbox */}
        <div className="flex items-center gap-3">
          <input
            id="is-caminhoneiro"
            type="checkbox"
            checked={isCaminhoneiro}
            onChange={(e) => setIsCaminhoneiro(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-green-600 focus:ring-green-500"
          />
          <Label htmlFor="is-caminhoneiro" className="text-sm text-zinc-700 cursor-pointer">
            Caminhoneiro (limite de faturamento diferenciado)
          </Label>
        </div>

        {/* Feedback messages */}
        {successMsg && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2" role="status">
            {successMsg}
          </p>
        )}
        {errorMsg && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2" role="alert">
            {errorMsg}
          </p>
        )}

        {/* Save button */}
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          disabled={!atividadePrincipal.trim() || saving}
          onClick={handleSave}
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>

        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate('/app/conta')}
          className="w-full text-center text-sm text-zinc-500 hover:text-zinc-700 underline"
        >
          Voltar para Conta
        </button>
      </div>
    </div>
  )
}
