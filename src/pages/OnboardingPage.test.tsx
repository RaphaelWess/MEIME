import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

// Mock hooks and services BEFORE importing the component
vi.mock('@/hooks/useOnboardingCnpj', () => ({
  useOnboardingCnpj: vi.fn(),
}))

vi.mock('@/services/empresa.service', () => ({
  empresaService: {
    save: vi.fn(),
  },
}))

vi.mock('@/stores/empresa.store', () => ({
  useEmpresaStore: vi.fn(),
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}))

import { useOnboardingCnpj } from '@/hooks/useOnboardingCnpj'
import { useEmpresaStore } from '@/stores/empresa.store'
import { useAuthStore } from '@/stores/auth.store'

const mockUseOnboardingCnpj = vi.mocked(useOnboardingCnpj)
const mockUseEmpresaStore = vi.mocked(useEmpresaStore)
const mockUseAuthStore = vi.mocked(useAuthStore)

import OnboardingPage from './OnboardingPage'

function setDefaultMocks() {
  mockUseAuthStore.mockReturnValue({
    user: { id: 'user-123', email: 'test@example.com' } as any,
    loading: false,
    setUser: vi.fn(),
    setLoading: vi.fn(),
  })
  mockUseEmpresaStore.mockReturnValue({
    empresa: null,
    loading: false,
    setEmpresa: vi.fn(),
    setLoading: vi.fn(),
  })
  // Default: idle state (no CNPJ typed yet)
  mockUseOnboardingCnpj.mockReturnValue({
    data: undefined,
    isLoading: false,
    isFetching: false,
    isSuccess: false,
    isError: false,
    error: null,
    status: 'pending',
    fetchStatus: 'idle',
  } as any)
}

function renderOnboarding() {
  return render(
    <MemoryRouter>
      <OnboardingPage />
    </MemoryRouter>,
  )
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setDefaultMocks()
  })

  it('renders CNPJ field with the correct placeholder', () => {
    renderOnboarding()
    const cnpjInput = screen.getByPlaceholderText('00.000.000/0000-00')
    expect(cnpjInput).toBeInTheDocument()
  })

  it('submit button is disabled when fields are empty', () => {
    renderOnboarding()
    const submitButton = screen.getByRole('button', { name: /salvar e começar/i })
    expect(submitButton).toBeDisabled()
  })

  it('shows CNPJ_NOT_FOUND error message when hook returns that error', () => {
    mockUseOnboardingCnpj.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: true,
      error: new Error('CNPJ_NOT_FOUND'),
      status: 'error',
      fetchStatus: 'idle',
    } as any)

    renderOnboarding()

    expect(
      screen.getByText(/CNPJ não encontrado/i),
    ).toBeInTheDocument()
  })

  it('shows generic API_ERROR message when hook returns that error', () => {
    mockUseOnboardingCnpj.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: true,
      error: new Error('API_ERROR'),
      status: 'error',
      fetchStatus: 'idle',
    } as any)

    renderOnboarding()

    expect(
      screen.getByText(/Não foi possível buscar os dados/i),
    ).toBeInTheDocument()
  })

  it('renders razao_social field as read-only when API returns success', () => {
    mockUseOnboardingCnpj.mockReturnValue({
      data: {
        cnpj: '11222333000181',
        razao_social: 'EMPRESA TESTE MEI',
        nome_fantasia: 'TESTE',
        cnae_fiscal: 7311400,
        cnae_fiscal_descricao: 'Agências de publicidade',
        situacao_cadastral: 2,
        descricao_situacao_cadastral: 'ATIVA',
        data_inicio_atividade: '2020-01-01',
      },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      status: 'success',
      fetchStatus: 'idle',
    } as any)

    renderOnboarding()

    // razao_social should be populated and read-only
    const razaoInput = screen.getByDisplayValue('EMPRESA TESTE MEI')
    expect(razaoInput).toBeInTheDocument()
    // Either disabled or readOnly attribute
    const isReadOnly = razaoInput.hasAttribute('disabled') || razaoInput.hasAttribute('readonly') || razaoInput.getAttribute('readOnly') !== null
    expect(isReadOnly).toBe(true)
  })
})
