/**
 * Predefined category lists for MEIME.
 * D-09: Lista predefinida de categorias para MEI prestador de servicos —
 * habilita filtros coerentes nas Fases 4 e 9.
 * These are the ONLY place category strings are defined. No free-form input.
 */

/**
 * Income categories (entradas) for MEI service providers.
 */
export const CATEGORIAS_ENTRADA = [
  'Servicos Prestados',
  'Venda de Produtos',
  'Outros',
] as const

/**
 * Expense categories (saidas) for MEI service providers.
 */
export const CATEGORIAS_SAIDA = [
  'Materiais e Suprimentos',
  'Transporte',
  'Alimentacao',
  'Software e Assinaturas',
  'Impostos e DAS',
  'Marketing e Publicidade',
  'Equipamentos',
  'Outros',
] as const

/**
 * Union of all categories (entrada + saida).
 */
export const TODAS_CATEGORIAS = [...CATEGORIAS_ENTRADA, ...CATEGORIAS_SAIDA] as const

/**
 * Type union of all valid category strings.
 */
export type Categoria = typeof TODAS_CATEGORIAS[number]
