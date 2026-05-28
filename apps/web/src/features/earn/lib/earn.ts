import { toast } from "sonner"

function fakeTxDelay(ms = 1500): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

export async function stakeSO4(_account: string, _amountSO4: number): Promise<string> {
  // TODO: Call StakingRouter.stakeSO4(amount) on Soroban:
  //   1. Build stakeXDR via contract client
  //   2. wallet.signTransaction(tx)
  //   3. sorobanClient.sendTransaction(signedTx)
  //   4. poll sorobanClient.getTransaction(hash) until SUCCESS/FAILED
  const toastId = toast.loading("Staking SO4…")
  await fakeTxDelay()
  toast.success("SO4 staked successfully", { id: toastId, description: "Tx: DUMMY (not real)" })
  return "DUMMY_TX_HASH"
}

export async function unstakeSO4(_account: string, _amountSO4: number): Promise<string> {
  // TODO: Call StakingRouter.unstakeSO4(amount) on Soroban
  const toastId = toast.loading("Unstaking SO4…")
  await fakeTxDelay()
  toast.success("SO4 unstaked successfully", { id: toastId, description: "Tx: DUMMY (not real)" })
  return "DUMMY_TX_HASH"
}

export async function depositGM(
  _account: string,
  poolName: string,
  _amountUsd: number,
): Promise<string> {
  // TODO: Call ExchangeRouter.createDeposit({ market, longTokenAmount, shortTokenAmount })
  //   Deposit is two-sided — user provides long + short tokens in current pool ratio
  const toastId = toast.loading(`Depositing into ${poolName}…`)
  await fakeTxDelay()
  toast.success("GM deposit submitted", { id: toastId, description: "Tx: DUMMY (not real)" })
  return "DUMMY_TX_HASH"
}

export async function withdrawGM(
  _account: string,
  poolName: string,
  _gmAmount: number,
): Promise<string> {
  // TODO: Call ExchangeRouter.createWithdrawal({ market, marketTokenAmount })
  const toastId = toast.loading(`Withdrawing from ${poolName}…`)
  await fakeTxDelay()
  toast.success("GM withdrawal submitted", { id: toastId, description: "Tx: DUMMY (not real)" })
  return "DUMMY_TX_HASH"
}

export async function depositGLV(
  _account: string,
  vaultName: string,
  _amountUsd: number,
): Promise<string> {
  // TODO: Call GlvRouter.createDeposit({ glv, longTokenAmount, shortTokenAmount })
  //   GLV deposits route through underlying GM pools — vault picks the optimal pool
  const toastId = toast.loading(`Depositing into ${vaultName}…`)
  await fakeTxDelay()
  toast.success("GLV deposit submitted", { id: toastId, description: "Tx: DUMMY (not real)" })
  return "DUMMY_TX_HASH"
}

export async function withdrawGLV(
  _account: string,
  vaultName: string,
  _glvAmount: number,
): Promise<string> {
  // TODO: Call GlvRouter.createWithdrawal({ glv, glvTokenAmount })
  const toastId = toast.loading(`Withdrawing from ${vaultName}…`)
  await fakeTxDelay()
  toast.success("GLV withdrawal submitted", { id: toastId, description: "Tx: DUMMY (not real)" })
  return "DUMMY_TX_HASH"
}

export async function claimRewards(_account: string): Promise<string> {
  // TODO: Call StakingRouter.claimRewards() on Soroban
  //   Sends esSO4 + WETH fee rewards to wallet in a single multicall tx
  const toastId = toast.loading("Claiming rewards…")
  await fakeTxDelay(1000)
  toast.success("Rewards claimed", { id: toastId, description: "Tx: DUMMY (not real)" })
  return "DUMMY_TX_HASH"
}

export async function compoundRewards(_account: string): Promise<string> {
  // TODO: Batch in one tx: claimRewards() → stakeEsSO4(amount) → stakeMPs()
  //   Compounding increases staking power without selling any tokens
  const toastId = toast.loading("Compounding rewards…")
  await fakeTxDelay(1200)
  toast.success("Rewards compounded", { id: toastId, description: "Tx: DUMMY (not real)" })
  return "DUMMY_TX_HASH"
}

export async function vestEsSO4(_account: string, _amount: number): Promise<string> {
  // TODO: Call VestingRouter.depositForVesting(amount)
  //   Locks esSO4 for 12-month linear vesting → converts 1:1 to SO4 on maturity
  const toastId = toast.loading("Starting esSO4 vesting…")
  await fakeTxDelay()
  toast.success("Vesting started", { id: toastId, description: "Tx: DUMMY (not real)" })
  return "DUMMY_TX_HASH"
}

export function buySO4(): void {
  // TODO: Route to DEX swap or protocol buy-back mechanism
  toast.info("SO4 purchase coming soon", { description: "DEX integration in progress" })
}
