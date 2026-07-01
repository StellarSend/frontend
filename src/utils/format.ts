export const formatAmount = (n: number, d = 2) => new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)
export const formatDate = (d: Date | string) => new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
export const formatCurrency = (n: number, c = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n)
