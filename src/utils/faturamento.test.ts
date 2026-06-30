import { describe, it, expect } from 'vitest'
import {
  calcLimiteAnual,
  calcTotalFaturado,
  calcPercentual,
  calcProjecao,
  calcAlertaAtivo,
  LIMITE_MEI_PADRAO,
  LIMITE_CAMINHONEIRO,
  THRESHOLD_DESENQUADRAMENTO,
} from '@/utils/faturamento'

// Minimal fake Transacao shape (satisfies Transacao type for test inputs)
const makeFakeEntrada = (valor: number, data = '2026-06-01') => ({
  id: '1',
  user_id: 'u1',
  tipo: 'entrada' as const,
  valor,
  categoria: null,
  descricao: null,
  tipo_pessoa: null,
  data,
  created_at: '',
})

describe('calcLimiteAnual', () => {
  it('empresa null → returns LIMITE_MEI_PADRAO (8_100_000)', () => {
    expect(calcLimiteAnual(null, 2026)).toBe(LIMITE_MEI_PADRAO)
    expect(calcLimiteAnual(null, 2026)).toBe(8_100_000)
  })

  it('data_abertura_mei null → returns LIMITE_MEI_PADRAO', () => {
    const empresa = { is_caminhoneiro: false, data_abertura_mei: null } as any
    expect(calcLimiteAnual(empresa, 2026)).toBe(LIMITE_MEI_PADRAO)
  })

  it('data_abertura_mei.year < currentYear → returns full LIMITE_MEI_PADRAO (D-06)', () => {
    const empresa = { is_caminhoneiro: false, data_abertura_mei: '2024-03-15' } as any
    expect(calcLimiteAnual(empresa, 2026)).toBe(LIMITE_MEI_PADRAO)
  })

  it('is_caminhoneiro=true, data_abertura_mei null → returns LIMITE_CAMINHONEIRO (25_160_000)', () => {
    const empresa = { is_caminhoneiro: true, data_abertura_mei: null } as any
    expect(calcLimiteAnual(empresa, 2026)).toBe(LIMITE_CAMINHONEIRO)
    expect(calcLimiteAnual(empresa, 2026)).toBe(25_160_000)
  })

  it('abriu em Janeiro do currentYear (month=1) → mesesRestantes=12 → limite completo (8_100_000)', () => {
    const empresa = { is_caminhoneiro: false, data_abertura_mei: '2026-01-15' } as any
    expect(calcLimiteAnual(empresa, 2026)).toBe(8_100_000)
  })

  it('abriu em Julho do currentYear (month=7) → mesesRestantes=6 → Math.round(6/12 × 8_100_000) = 4_050_000', () => {
    const empresa = { is_caminhoneiro: false, data_abertura_mei: '2026-07-01' } as any
    expect(calcLimiteAnual(empresa, 2026)).toBe(4_050_000)
  })
})

describe('calcTotalFaturado', () => {
  it('empty array → 0', () => {
    expect(calcTotalFaturado([])).toBe(0)
  })

  it('two entradas (500_000 + 300_000) → 800_000', () => {
    const transacoes = [
      makeFakeEntrada(500_000),
      makeFakeEntrada(300_000),
    ]
    expect(calcTotalFaturado(transacoes)).toBe(800_000)
  })
})

describe('calcPercentual', () => {
  it('totalFaturado=0, limiteAnual=8_100_000 → 0', () => {
    expect(calcPercentual(0, 8_100_000)).toBe(0)
  })

  it('totalFaturado=4_050_000, limiteAnual=8_100_000 → 50', () => {
    expect(calcPercentual(4_050_000, 8_100_000)).toBe(50)
  })

  it('totalFaturado=8_100_000, limiteAnual=8_100_000 → 100', () => {
    expect(calcPercentual(8_100_000, 8_100_000)).toBe(100)
  })

  it('totalFaturado=9_000_000, limiteAnual=8_100_000 → result > 100', () => {
    const result = calcPercentual(9_000_000, 8_100_000)
    expect(result).toBeGreaterThan(100)
  })
})

describe('calcProjecao', () => {
  it('mesesDecorridos=0 (today = Jan 15) → tipo=hidden (D-15)', () => {
    // In January, currentMonth=1, mesesDecorridos = 1-1 = 0 → hidden
    const result = calcProjecao(100_000, 8_100_000, 2026, new Date('2026-01-15'))
    expect(result.tipo).toBe('hidden')
  })

  it('mediaFaturamentoMensal=0 (totalFaturado=0, mesesDecorridos=5) → tipo=hidden (D-15)', () => {
    // June 15: mesesDecorridos = 5, but totalFaturado=0 → media=0 → hidden
    const result = calcProjecao(0, 8_100_000, 2026, new Date('2026-06-15'))
    expect(result.tipo).toBe('hidden')
  })

  it('ritmo baixo — totalFaturado=100_000, today=June 15 → tipo=dentro_do_limite (D-16)', () => {
    // June 15: mesesDecorridos=5, media=20_000/month, limiteRestante=8_000_000
    // mesesParaEstourar = ceil(8_000_000/20_000) = 400 months → targetYear > 2026 → dentro_do_limite
    const result = calcProjecao(100_000, 8_100_000, 2026, new Date('2026-06-15'))
    expect(result.tipo).toBe('dentro_do_limite')
  })

  it('ritmo normal breach this year: totalFaturado=6_000_000, today=June 15 → tipo=mes_ano, mes=8, ano=2026', () => {
    // June 15: mesesDecorridos=5, media=1_200_000/month
    // limiteRestante=2_100_000, mesesParaEstourar=ceil(2_100_000/1_200_000)=2
    // targetMonth = June(6) + 2 = August(8), targetYear=2026
    const result = calcProjecao(6_000_000, 8_100_000, 2026, new Date('2026-06-15'))
    expect(result.tipo).toBe('mes_ano')
    if (result.tipo === 'mes_ano') {
      expect(result.mes).toBe(8)
      expect(result.ano).toBe(2026)
    }
  })

  it('already exceeded (totalFaturado=9_000_000 > limiteAnual) → tipo=mes_ano with current month/year', () => {
    const today = new Date('2026-06-15')
    const result = calcProjecao(9_000_000, 8_100_000, 2026, today)
    expect(result.tipo).toBe('mes_ano')
    if (result.tipo === 'mes_ano') {
      expect(result.mes).toBe(6)
      expect(result.ano).toBe(2026)
    }
  })
})

describe('calcAlertaAtivo', () => {
  it('totalFaturado >= THRESHOLD_DESENQUADRAMENTO (9_720_000) → 97200 (D-10 most severe)', () => {
    // percentual = 9_720_000/8_100_000 * 100 = 120
    expect(calcAlertaAtivo(9_720_000, 8_100_000, 120)).toBe(97200)
    expect(calcAlertaAtivo(THRESHOLD_DESENQUADRAMENTO, 8_100_000, 120)).toBe(97200)
  })

  it('totalFaturado=8_500_000, percentual=104.9 (< THRESHOLD_DESENQUADRAMENTO, >= 100%) → 100', () => {
    expect(calcAlertaAtivo(8_500_000, 8_100_000, 104.9)).toBe(100)
  })

  it('totalFaturado=7_400_000, percentual=91.4 → 90', () => {
    expect(calcAlertaAtivo(7_400_000, 8_100_000, 91.4)).toBe(90)
  })

  it('totalFaturado=5_700_000, percentual=70.4 → 70', () => {
    expect(calcAlertaAtivo(5_700_000, 8_100_000, 70.4)).toBe(70)
  })

  it('totalFaturado=0, percentual=0 → null', () => {
    expect(calcAlertaAtivo(0, 8_100_000, 0)).toBe(null)
  })
})
