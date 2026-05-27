import { NETWORK } from "@/app/config/network"

const DEFAULT_CALLBACK_PATH = "/"

export function createSep7TransactionUri({
  callbackUrl,
  xdr,
}: {
  callbackUrl: string
  xdr: string
}) {
  const params = new URLSearchParams({
    xdr,
    callback: callbackUrl,
    network_passphrase: NETWORK.networkPassphrase,
  })

  return `web+stellar:tx?${params.toString()}`
}

export function createSep7ConnectUri(origin: string) {
  const callbackUrl = new URL(DEFAULT_CALLBACK_PATH, origin).toString()
  const params = new URLSearchParams({
    callback: callbackUrl,
    network_passphrase: NETWORK.networkPassphrase,
  })

  return `web+stellar:signin?${params.toString()}`
}
