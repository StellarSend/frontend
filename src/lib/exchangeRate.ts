import { horizonUrl } from './api'

export interface ExchangeRateResult {
  xlmUsd: number
  source: 'coingecko' | 'horizon' | 'fallback'
}

/** Fallback price when external API and DEX are unreachable. */
export const DEFAULT_FALLBACK_XLM_USD = 0.12

// Standard Mainnet USDC issuer on Stellar
const MAINNET_USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'

/**
 * Fetch live XLM/USD exchange rate.
 * Tries CoinGecko spot price first, then Horizon DEX orderbook (USDC/XLM) on mainnet,
 * and falls back gracefully to default placeholder if network fails.
 */
export async function fetchExchangeRate(
  network: 'testnet' | 'mainnet' = 'mainnet',
): Promise<ExchangeRateResult> {
  // 1. Try CoinGecko public simple price API (CORS friendly)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd',
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      },
    )
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      const price = data?.stellar?.usd
      if (typeof price === 'number' && price > 0) {
        return { xlmUsd: price, source: 'coingecko' }
      }
    }
  } catch {
    // Ignore CoinGecko rate limit / network error and proceed to fallback/orderbook
  }

  // 2. Try Stellar DEX orderbook (USDC/XLM) on Mainnet Horizon
  if (network === 'mainnet') {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

      const base = horizonUrl('mainnet')
      const params = new URLSearchParams({
        selling_asset_type: 'native',
        buying_asset_type: 'credit_alphanum4',
        buying_asset_code: 'USDC',
        buying_asset_issuer: MAINNET_USDC_ISSUER,
        limit: '1',
      })

      const res = await fetch(`${base}/order_book?${params}`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        const topBid = data?.bids?.[0]?.price
        const topAsk = data?.asks?.[0]?.price
        const priceNum = topBid ? parseFloat(topBid) : topAsk ? parseFloat(topAsk) : null

        if (priceNum && !Number.isNaN(priceNum) && priceNum > 0) {
          return { xlmUsd: priceNum, source: 'horizon' }
        }
      }
    } catch {
      // Horizon DEX query failed
    }
  }

  // 3. Fallback placeholder
  return { xlmUsd: DEFAULT_FALLBACK_XLM_USD, source: 'fallback' }
}
