import {
  StellarWalletsKit,
  FreighterModule,
  xBullModule,
  LobstrModule,
  AlbedoModule,
  HanaModule,
  WalletConnectModule,
} from "@creit.tech/stellar-wallets-kit"
import { NETWORK } from "@/app/config/network"

const supportedWalletModules = [
  FreighterModule,
  xBullModule,
  LobstrModule,
  AlbedoModule,
  HanaModule,
  WalletConnectModule,
] as const

const createWalletKit = () =>
  new StellarWalletsKit({
    networkPassphrase: NETWORK.networkPassphrase,
    modules: supportedWalletModules,
  })

let walletKitInstance: InstanceType<typeof StellarWalletsKit> | undefined

const getWalletKitInstance = () => {
  if (!walletKitInstance) {
    walletKitInstance = createWalletKit()
  }
  return walletKitInstance
}

export const walletKit = new Proxy({} as InstanceType<typeof StellarWalletsKit>, {
  get(_, property, receiver) {
    return Reflect.get(getWalletKitInstance(), property, receiver)
  },
  set(_, property, value) {
    return Reflect.set(getWalletKitInstance(), property, value)
  },
  has(_, property) {
    return property in getWalletKitInstance()
  },
  ownKeys() {
    return Reflect.ownKeys(getWalletKitInstance())
  },
  getOwnPropertyDescriptor(_, property) {
    const descriptor = Object.getOwnPropertyDescriptor(getWalletKitInstance(), property)
    if (descriptor) descriptor.configurable = true
    return descriptor
  },
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk"
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils"
import { Networks } from "@creit.tech/stellar-wallets-kit/types"
import { NETWORK } from "@/app/config/network"

const kitNetwork =
  NETWORK.name === "mainnet" ? Networks.PUBLIC : Networks.TESTNET

StellarWalletsKit.init({
  modules: defaultModules(),
  network: kitNetwork,
})
