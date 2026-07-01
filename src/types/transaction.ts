export type TxStatus = 'pending' | 'success' | 'failed'

export interface Transaction {
  id: string
  from: string
  to: string
  amount: string
  asset: string
  fee: string
  memo?: string
  status: TxStatus
  ledger: number
  createdAt: string
}
