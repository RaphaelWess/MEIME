import { create } from 'zustand'
import type { EmpresaMei } from '@/services/empresa.service'

interface EmpresaStore {
  /** The current user's empresa_mei row, or null if not yet loaded or not found. */
  empresa: EmpresaMei | null
  /** True while the initial empresa fetch is in progress (prevents guard flash). */
  loading: boolean
  /** Set the empresa (called by EmpresaProvider on boot hydration). */
  setEmpresa: (empresa: EmpresaMei | null) => void
  /** Set the loading state (called by EmpresaProvider after fetch resolves). */
  setLoading: (loading: boolean) => void
}

/**
 * Zustand empresa store — single source of truth for empresa_mei state.
 * EmpresaProvider feeds this store via getForCurrentUser() on boot.
 * Components read empresa/loading; they do NOT call Supabase directly.
 *
 * Mirrors useAuthStore shape exactly (D-11).
 */
export const useEmpresaStore = create<EmpresaStore>((set) => ({
  empresa: null,
  loading: true,
  setEmpresa: (empresa) => set({ empresa }),
  setLoading: (loading) => set({ loading }),
}))
