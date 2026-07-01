import { StrKey } from '@stellar/stellar-sdk'
export const isValidStellarAddress = (a: string) => StrKey.isValidEd25519PublicKey(a)
export const truncateAddress = (a: string, c = 6) => a.length <= c*2 ? a : a.slice(0,c)+'…'+a.slice(-c)
export const xlmToStroops = (x: number) => BigInt(Math.round(x * 10_000_000))
export const stroopsToXlm = (s: bigint) => Number(s) / 10_000_000
