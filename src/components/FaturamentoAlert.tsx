import { AlertTriangle } from 'lucide-react'
import { centsToBRL } from '@/utils/currency'
import type { AlertaNivel } from '@/utils/faturamento'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FaturamentoAlertProps {
  nivel: AlertaNivel
  limiteAnual: number
}

// ---------------------------------------------------------------------------
// Alert configuration lookup table
// ---------------------------------------------------------------------------

const ALERT_CONFIG: Record<
  AlertaNivel,
  {
    bg: string
    border: string
    text: string
    icon: string
    heading: string
    body: string | null
    cta: { label: string; url: string } | null
  }
> = {
  70: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    text: 'text-yellow-800',
    icon: 'text-yellow-500',
    heading: 'Você já usou 70% do limite anual.',
    body: 'Fique de olho no ritmo de faturamento.',
    cta: null,
  },
  90: {
    bg: 'bg-orange-50',
    border: 'border-orange-400',
    text: 'text-orange-800',
    icon: 'text-orange-500',
    heading: 'Atenção: 90% do limite consumido.',
    body: 'Considere desacelerar as receitas até o final do ano.',
    cta: null,
  },
  100: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    text: 'text-red-700',
    icon: 'text-red-500',
    heading: 'Limite atingido!',
    body: null,
    cta: null,
  },
  97200: {
    bg: 'bg-red-100',
    border: 'border-red-700',
    text: 'text-red-900',
    icon: 'text-red-700',
    heading: 'Zona de desenquadramento obrigatório!',
    body: 'Você ultrapassou R$ 97.200 — é obrigatório solicitar o desenquadramento do MEI.',
    cta: {
      label: 'Saiba como se desenquadrar',
      url: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor',
    },
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FaturamentoAlert({ nivel, limiteAnual }: FaturamentoAlertProps) {
  const config = ALERT_CONFIG[nivel]

  return (
    <div
      role="alert"
      className={`${config.bg} rounded-xl border-l-4 p-4 flex flex-col gap-2 ${config.border} ${config.text}`}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        <AlertTriangle className={'w-4 h-4 shrink-0 ' + config.icon} aria-hidden="true" />
        <span className="font-medium text-sm">{config.heading}</span>
      </div>

      {/* Body text */}
      {nivel === 100 ? (
        <p className="text-sm pl-6">
          Receitas acima de {centsToBRL(limiteAnual)} podem causar desenquadramento.
        </p>
      ) : config.body !== null ? (
        <p className="text-sm pl-6">{config.body}</p>
      ) : null}

      {/* CTA link — only for nivel 97200 */}
      {config.cta !== null && (
        <a
          href={config.cta.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Saiba como se desenquadrar do MEI (abre em nova aba)"
          className={'pl-6 text-sm font-medium underline min-h-[44px] flex items-center ' + config.text}
        >
          {config.cta.label}
        </a>
      )}
    </div>
  )
}
