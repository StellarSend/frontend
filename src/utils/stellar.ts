export {
  isValidStellarAddress,
  truncateAddress,
  formatAmount,
  formatXLM,
  formatUSD,
} from '@/lib/stellar'

export const xlmToStroops = (x: number) => BigInt(Math.round(x * 10_000_000))
export const stroopsToXlm = (s: bigint) => Number(s) / 10_000_000
