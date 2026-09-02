import {
  formatDate as libFormatDate,
  formatDateTime as libFormatDateTime,
} from '@/lib/utils'

export const formatAmount = (n: number, d = 2) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n)

export const formatDate = (d: Date | string, opts?: Intl.DateTimeFormatOptions) =>
  libFormatDate(typeof d === 'string' ? d : d.toISOString(), opts)

export const formatDateTime = (d: Date | string) =>
  libFormatDateTime(typeof d === 'string' ? d : d.toISOString())

export const formatCurrency = (n: number, c = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n)
