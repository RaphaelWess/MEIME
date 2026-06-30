import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer'
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
import { useCurrencyInput } from '@/hooks/useCurrencyInput'
import { transacaoService, type Transacao } from '@/services/transacao.service'
import { CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA } from '@/utils/categories'

/**
 * TransactionSheet — bottom-sheet form for creating and editing transactions.
 *
 * Props:
 *   open: boolean — controls Drawer visibility
 *   onOpenChange: (open: boolean) => void — Drawer callback
 *   transaction?: Transacao — undefined = create mode; defined = edit mode (D-05)
 *
 * Fulfills:
 *   FIN-01 — record transaction in < 3 taps
 *   FIN-02 — PF/PJ classification
 *   D-03 — Entrada (green-600) / Saida (red-600) toggle
 *   D-04 — invalidates ['transacoes'] cache after save/delete (D-21)
 *   D-05 — dual create/edit mode via transaction prop
 *   D-06, D-07 — push-right BRL input via useCurrencyInput
 *   D-09 — predefined category lists
 *   D-18 — all fields editable in edit mode
 *   D-19 — AlertDialog confirmation for delete
 *   T-04 — no dangerouslySetInnerHTML
 */

export interface TransactionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transacao
}

export function TransactionSheet({ open, onOpenChange, transaction }: TransactionSheetProps) {
  const queryClient = useQueryClient()
  const isEditing = transaction !== undefined

  // Form state
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada')
  const { cents, displayValue, handleChange: handleValueChange, setCents } = useCurrencyInput(0)
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_ENTRADA[0])
  const [data, setData] = useState<string>(new Date().toISOString().slice(0, 10))
  const [tipoPessoa, setTipoPessoa] = useState<'PF' | 'PJ' | null>(null)
  const [descricao, setDescricao] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Reset / initialize fields when sheet opens or transaction changes (D-05)
  useEffect(() => {
    if (!open) return

    if (transaction) {
      // Edit mode — pre-fill from transaction
      setTipo(transaction.tipo)
      setCents(transaction.valor)
      setCategoria(transaction.categoria ?? '')
      setData(transaction.data)
      setTipoPessoa(transaction.tipo_pessoa)
      setDescricao(transaction.descricao ?? '')
    } else {
      // Create mode — reset to defaults
      setTipo('entrada')
      setCents(0)
      setCategoria(CATEGORIAS_ENTRADA[0])
      setData(new Date().toISOString().slice(0, 10))
      setTipoPessoa(null)
      setDescricao('')
    }
    setError(null)
  }, [open, transaction, setCents])

  // When tipo changes, reset categoria to first item of new list (D-09)
  function handleTipoChange(newTipo: 'entrada' | 'saida') {
    setTipo(newTipo)
    if (newTipo === 'entrada') {
      setCategoria(CATEGORIAS_ENTRADA[0])
    } else {
      setCategoria(CATEGORIAS_SAIDA[0])
    }
  }

  // PF/PJ toggle — clicking the already-selected option clears it (null = optional)
  function handleTipoPessoaToggle(value: 'PF' | 'PJ') {
    setTipoPessoa(prev => (prev === value ? null : value))
  }

  async function handleSave() {
    setError(null)

    // T-03-02: UI-layer validation (service also validates — defense in depth)
    if (cents <= 0) {
      setError('Informe um valor maior que zero')
      return
    }

    if (!data) {
      setError('Informe a data do lancamento')
      return
    }

    const input = {
      tipo,
      valor: cents,
      categoria: categoria || null,
      descricao: descricao.trim() || null,
      tipo_pessoa: tipoPessoa,
      data,
    }

    try {
      if (isEditing) {
        await transacaoService.update(transaction.id, input)
      } else {
        await transacaoService.create(input)
      }
      // D-21: invalidate namespace only — never ['transacoes', year, month]
      queryClient.invalidateQueries({ queryKey: ['transacoes'] })
      onOpenChange(false)
    } catch {
      setError('Nao foi possivel salvar. Tente novamente.')
    }
  }

  async function handleDelete() {
    if (!isEditing) return
    setError(null)

    try {
      await transacaoService.delete(transaction.id)
      // D-21: invalidate namespace only
      queryClient.invalidateQueries({ queryKey: ['transacoes'] })
      onOpenChange(false)
    } catch {
      setError('Nao foi possivel excluir. Tente novamente.')
    }
  }

  const categorias = tipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {isEditing ? 'Editar lancamento' : 'Novo lancamento'}
          </DrawerTitle>
        </DrawerHeader>

        {/* Form body */}
        <div className="space-y-4 px-4 pb-2 overflow-y-auto">

          {/* Tipo toggle — D-03: Entrada (green-600) / Saida (red-600) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Tipo
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTipoChange('entrada')}
                className={
                  tipo === 'entrada'
                    ? 'flex-1 rounded-md px-4 py-2 text-sm font-medium bg-green-600 text-white'
                    : 'flex-1 rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted'
                }
              >
                Entrada
              </button>
              <button
                type="button"
                onClick={() => handleTipoChange('saida')}
                className={
                  tipo === 'saida'
                    ? 'flex-1 rounded-md px-4 py-2 text-sm font-medium bg-red-600 text-white'
                    : 'flex-1 rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted'
                }
              >
                Saida
              </button>
            </div>
          </div>

          {/* Valor — D-06, D-07: push-right BRL input, type="text" inputMode="numeric" */}
          <div>
            <label
              htmlFor="transacao-valor"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Valor
            </label>
            <input
              id="transacao-valor"
              type="text"
              inputMode="numeric"
              value={displayValue}
              onChange={handleValueChange}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Categoria — D-09: predefined list, switches on tipo change */}
          <div>
            <label
              htmlFor="transacao-categoria"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Categoria
            </label>
            <select
              id="transacao-categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Data — D-02, D-18 */}
          <div>
            <label
              htmlFor="transacao-data"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Data
            </label>
            <input
              id="transacao-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* PF/PJ toggle — D-02, D-13, FIN-02: optional field, null = not set */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Pessoa
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTipoPessoaToggle('PF')}
                className={
                  tipoPessoa === 'PF'
                    ? 'flex-1 rounded-md px-4 py-2 text-sm font-medium bg-foreground text-background'
                    : 'flex-1 rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted'
                }
              >
                PF
              </button>
              <button
                type="button"
                onClick={() => handleTipoPessoaToggle('PJ')}
                className={
                  tipoPessoa === 'PJ'
                    ? 'flex-1 rounded-md px-4 py-2 text-sm font-medium bg-foreground text-background'
                    : 'flex-1 rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted'
                }
              >
                PJ
              </button>
            </div>
          </div>

          {/* Descricao — D-02: optional textarea */}
          <div>
            <label
              htmlFor="transacao-descricao"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Descricao (opcional)
            </label>
            <textarea
              id="transacao-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Error message — T-04: text node, never dangerouslySetInnerHTML */}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <DrawerFooter>
          {/* Salvar button */}
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
          >
            Salvar
          </button>

          {/* Excluir — D-19: only visible in edit mode, wrapped in AlertDialog */}
          {isEditing && (
            <AlertDialog>
              <AlertDialogTrigger
                className="inline-flex w-full items-center justify-center rounded-md border border-red-300 bg-background px-4 py-2 text-sm font-medium text-red-600 ring-offset-background transition-colors hover:bg-red-50 hover:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Excluir lancamento
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir esta transacao?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acao nao pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 text-white hover:bg-red-700"
                    onClick={handleDelete}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
