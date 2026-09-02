export const MAX_MEMO_BYTES = 28

export const getUtf8ByteLength = (str: string): number => {
  return new TextEncoder().encode(str).length
}

export const truncateUtf8Bytes = (str: string, maxBytes: number = MAX_MEMO_BYTES): string => {
  const encoder = new TextEncoder()
  const encoded = encoder.encode(str)
  if (encoded.length <= maxBytes) return str

  const decoder = new TextDecoder('utf-8')
  return decoder.decode(encoded.subarray(0, maxBytes)).replace(/\uFFFD$/, '')
}

export const validateAmount = (v: string) => { const n = parseFloat(v); if (!v || isNaN(n)) return 'Required'; if (n <= 0) return 'Must be positive'; if (n < 0.01) return 'Min 0.01 XLM'; return null }
export const validateRecipient = (a: string) => { if (!a) return 'Required'; if (!a.startsWith('G') || a.length !== 56) return 'Invalid address'; return null }
export const validateMemo = (m: string) => getUtf8ByteLength(m) > MAX_MEMO_BYTES ? `Max ${MAX_MEMO_BYTES} bytes` : null

