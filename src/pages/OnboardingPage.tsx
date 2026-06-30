import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCnpjMask } from '@/hooks/useCnpjMask'
import { useOnboardingCnpj } from '@/hooks/useOnboardingCnpj'
import { isValidCnpj } from '@/utils/cnpj'
import { empresaService, type SaveEmpresaInput } from '@/services/empresa.service'
import { useEmpresaStore } from '@/stores/empresa.store'
import { useAuthStore } from '@/stores/auth.store'

/**
 * OnboardingPage — CNPJ lookup + empresa save flow.
 * Standalone full-screen page — no AppShell, no BottomNav.
 * Rendered when authenticated user has no empresa_mei row yet.
 */
export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { setEmpresa } = useEmpresaStore()

  // CNPJ input state
  const { raw, masked, handleChange } = useCnpjMask()

  // API lookup driven by the raw CNPJ
  const { data, isFetching, isSuccess, isError, error } = useOnboardingCnpj(raw)

  // Editable fields (pre-filled from API when available)
  const [razaoSocial, setRazaoSocial] = useState('')
  const [cnpjDescricao, setCnpjDescricao] = useState('')
  const [atividadePrincipal, setAtividadePrincipal] = useState('')
  const [dataAberturaMe, setDataAberturaMe] = useState('')

  // Track whether API data has been applied to form fields
  const [apiDataApplied, setApiDataApplied] = useState<string | null>(null)

  // Apply API data to fields when lookup succeeds (only once per CNPJ)
  if (isSuccess && data && apiDataApplied !== raw) {
    setRazaoSocial(data.razao_social ?? '')
    setCnpjDescricao(data.cnae_fiscal_descricao ?? '')
    setAtividadePrincipal(data.cnae_fiscal_descricao ?? '')
    setDataAberturaMe(data.data_inicio_atividade ?? '')
    setApiDataApplied(raw)
  }

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const canSubmit = razaoSocial.trim().length > 0 && dataAberturaMe.trim().length > 0 && !isSubmitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !user) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const payload: SaveEmpresaInput = {
        user_id: user.id,
        cnpj: raw,
        razao_social: razaoSocial,
        nome_fantasia: data?.nome_fantasia ?? '',
        cnae_fiscal: data?.cnae_fiscal ?? null,
        cnae_fiscal_descricao: cnpjDescricao,
        // CRITICAL: store the text string ("ATIVA"), not the integer (2)
        situacao_cadastral: data?.descricao_situacao_cadastral ?? null,
        data_inicio_atividade: data?.data_inicio_atividade ?? null,
        atividade_principal: atividadePrincipal,
        data_abertura_mei: dataAberturaMe,
        is_caminhoneiro: false,
      }

      const result = await empresaService.save(payload)
      setEmpresa(result)
      navigate('/app', { replace: true })
    } catch {
      setSubmitError('Erro ao salvar. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Error message from CNPJ lookup (API error) or local validation failure
  const cnpjFormatInvalid = raw.length === 14 && !isValidCnpj(raw)
  const cnpjErrorMessage = cnpjFormatInvalid
    ? 'CNPJ inválido. Verifique os dígitos ou preencha os dados manualmente.'
    : isError
    ? error?.message === 'CNPJ_NOT_FOUND'
      ? 'CNPJ não encontrado. Verifique o número ou preencha os dados manualmente.'
      : 'Não foi possível buscar os dados. Preencha manualmente.'
    : null

  // Warning when company status is not ATIVA
  const showStatusWarning =
    isSuccess && data?.descricao_situacao_cadastral && data.descricao_situacao_cadastral !== 'ATIVA'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao MEIME</h1>
          <p className="mt-1 text-sm text-gray-500">
            Informe o seu CNPJ para começar a controlar seu faturamento.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* CNPJ field */}
          <div className="mb-4">
            <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">
              CNPJ
            </label>
            <input
              id="cnpj"
              type="text"
              inputMode="numeric"
              value={masked}
              onChange={handleChange}
              maxLength={18}
              placeholder="00.000.000/0000-00"
              autoComplete="off"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
          </div>

          {/* Loading indicator */}
          {isFetching && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
              <svg
                className="animate-spin h-4 w-4 text-green-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Buscando dados do CNPJ...
            </div>
          )}

          {/* CNPJ lookup error */}
          {cnpjErrorMessage && (
            <p className="mb-4 text-sm text-red-600">{cnpjErrorMessage}</p>
          )}

          {/* Status warning (non-ATIVA) */}
          {showStatusWarning && (
            <p className="mb-4 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              Atenção: situação cadastral {data!.descricao_situacao_cadastral}. Você ainda pode continuar.
            </p>
          )}

          {/* Razão Social */}
          <div className="mb-4">
            <label htmlFor="razao_social" className="block text-sm font-medium text-gray-700 mb-1">
              Razão Social
            </label>
            {isSuccess ? (
              <input
                id="razao_social"
                type="text"
                value={razaoSocial}
                readOnly
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-base text-gray-700 cursor-not-allowed"
              />
            ) : (
              <input
                id="razao_social"
                type="text"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                placeholder="Nome da sua empresa MEI"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              />
            )}
          </div>

          {/* CNAE / Atividade Principal (from API) */}
          {(isSuccess || isError) && (
            <>
              <div className="mb-4">
                <label htmlFor="cnae_descricao" className="block text-sm font-medium text-gray-700 mb-1">
                  Atividade (CNAE)
                </label>
                {isSuccess ? (
                  <p id="cnae_descricao" className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    {cnpjDescricao}
                  </p>
                ) : (
                  <input
                    id="cnae_descricao"
                    type="text"
                    value={cnpjDescricao}
                    onChange={(e) => setCnpjDescricao(e.target.value)}
                    placeholder="Atividade econômica principal"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                )}
              </div>

              {/* Situação Cadastral */}
              {isSuccess && data?.descricao_situacao_cadastral && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Situação Cadastral
                  </label>
                  <p className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    {data.descricao_situacao_cadastral}
                  </p>
                </div>
              )}

              {/* Atividade Principal (editable) */}
              <div className="mb-4">
                <label htmlFor="atividade_principal" className="block text-sm font-medium text-gray-700 mb-1">
                  Atividade Principal
                </label>
                <input
                  id="atividade_principal"
                  type="text"
                  value={atividadePrincipal}
                  onChange={(e) => setAtividadePrincipal(e.target.value)}
                  placeholder="Descreva a atividade principal do seu MEI"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Data de abertura (always shown after CNPJ is typed) */}
          {(raw.length > 0 || isSuccess || isError) && (
            <div className="mb-6">
              <label htmlFor="data_abertura_mei" className="block text-sm font-medium text-gray-700 mb-1">
                Data de Abertura do MEI
              </label>
              <input
                id="data_abertura_mei"
                type="date"
                value={dataAberturaMe}
                onChange={(e) => setDataAberturaMe(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              />
            </div>
          )}

          {/* Submit error */}
          {submitError && (
            <p className="mb-4 text-sm text-red-600">{submitError}</p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar e começar'}
          </button>
        </form>
      </div>
    </div>
  )
}
