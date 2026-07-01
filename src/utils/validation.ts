export const validateAmount = (v: string) => { const n = parseFloat(v); if (!v || isNaN(n)) return 'Required'; if (n <= 0) return 'Must be positive'; if (n < 0.01) return 'Min 0.01 XLM'; return null }
export const validateRecipient = (a: string) => { if (!a) return 'Required'; if (!a.startsWith('G') || a.length !== 56) return 'Invalid address'; return null }
export const validateMemo = (m: string) => m.length > 28 ? 'Max 28 chars' : null
