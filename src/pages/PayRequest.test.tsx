import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PayRequest from './PayRequest'
import * as paymentRequestsHooks from '@/hooks/usePaymentRequests'
import * as walletHooks from '@/hooks/useWallet'
import * as sendPaymentHooks from '@/hooks/useSendPayment'

vi.mock('@/hooks/usePaymentRequests')
vi.mock('@/hooks/useWallet')
vi.mock('@/hooks/useSendPayment')

const mockPaymentRequest = {
  id: 'req_123',
  requesterPublicKey: 'GA2C5RFPE6GCKMY3US5PAB6UZLKIGAHWKXX2GIOVPWW27NO6KIYJJLQG',
  amount: '50.0000000',
  assetCode: 'XLM',
  memo: 'Invoice 101',
  status: 'open' as const,
  createdAt: '2026-09-01T12:00:00Z',
}

describe('PayRequest Page', () => {
  let queryClient: QueryClient
  const mockRefetch = vi.fn().mockResolvedValue({ data: mockPaymentRequest })
  const mockRequestQuote = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    mockRefetch.mockReset().mockResolvedValue({ data: mockPaymentRequest })
    mockRequestQuote.mockReset()

    vi.mocked(walletHooks.useWallet).mockReturnValue({
      wallet: {
        status: 'connected',
        publicKey: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7',
        network: 'testnet',
        account: null,
        isFreighterInstalled: true,
        error: null,
      },
      publicKey: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7',
      isConnected: true,
      isConnecting: false,
      hasError: false,
      network: 'testnet',
      signTransaction: vi.fn(),
      refreshAccount: vi.fn(),
      setNetwork: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      account: null,
      error: null,
      isFreighterInstalled: true,
      xlmBalance: '100',
      usdcBalance: '50',
    })

    vi.mocked(paymentRequestsHooks.usePaymentRequest).mockReturnValue({
      data: mockPaymentRequest,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      error: null,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof paymentRequestsHooks.usePaymentRequest>)

    vi.mocked(sendPaymentHooks.useSendPayment).mockReturnValue({
      state: {
        step: 'form',
        quote: null,
        result: null,
        error: null,
        formValues: null,
      },
      requestQuote: mockRequestQuote,
      confirmSend: vi.fn(),
      reset: vi.fn(),
      goBack: vi.fn(),
      isQuoting: false,
      isSending: false,
      supportedAssets: [{ code: 'XLM', name: 'Stellar Lumens', decimals: 7, issuer: null }],
    })
  })

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/pay/req_123']}>
          <Routes>
            <Route path="/pay/:id" element={<PayRequest />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders destination and amount as readOnly in SendForm', () => {
    renderComponent()

    const recipientInput = screen.getByLabelText(/recipient stellar address/i)
    const amountInput = screen.getByLabelText(/you send/i)

    expect(recipientInput).toHaveAttribute('readonly')
    expect(amountInput).toHaveAttribute('readonly')
    expect(recipientInput).toHaveValue(mockPaymentRequest.requesterPublicKey)
    expect(amountInput).toHaveValue(50)
  })

  it('submits quote when form is submitted for an open request', async () => {
    renderComponent()

    const submitBtn = screen.getByRole('button', { name: /get quote & review/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled()
      expect(mockRequestQuote).toHaveBeenCalled()
    })
  })

  it('blocks submit if payment request transitioned to non-open state', async () => {
    mockRefetch.mockResolvedValueOnce({
      data: { ...mockPaymentRequest, status: 'cancelled' },
    })

    renderComponent()

    const submitBtn = screen.getByRole('button', { name: /get quote & review/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled()
    })
    expect(mockRequestQuote).not.toHaveBeenCalled()
  })
})
