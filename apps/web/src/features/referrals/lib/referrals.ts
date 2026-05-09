import { toast } from "sonner"

function fakeTxDelay(ms = 1500): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

export async function setTraderReferralCode(_account: string, code: string): Promise<string> {
  // TODO: Call ReferralsRouter.setTraderReferralCodeByUser(bytes32(code)) on Soroban
  //   1. Verify code exists via ReferralsReader.getCodeOwner(code) — must not be zero address
  //   2. Build and sign transaction
  //   3. Submit and poll for SUCCESS
  const toastId = toast.loading(`Joining with code "${code}"…`)
  await fakeTxDelay()
  toast.success(`Referral code "${code}" applied`, {
    id: toastId,
    description: "5% fee discount is now active on your trades",
  })
  return "DUMMY_TX_HASH"
}

export async function createAffiliateCode(_account: string, code: string): Promise<string> {
  // TODO: Call ReferralsRouter.registerCode(bytes32(code)) on Soroban
  //   1. Check code availability: ReferralsReader.getCodeOwner(code) === zero address
  //   2. Build registerCode instruction, sign, submit
  //   3. Poll until SUCCESS — code becomes active immediately
  const toastId = toast.loading(`Registering code "${code}"…`)
  await fakeTxDelay()
  toast.success(`Code "${code}" registered!`, {
    id: toastId,
    description: "Share your code to start earning commissions",
  })
  return "DUMMY_TX_HASH"
}

export async function claimDistribution(_account: string, _epochId: string): Promise<string> {
  // TODO: Call RewardDistributor.claimForEpoch(epochId) on Soroban
  //   Transfers USDC + esSO4 affiliate rewards to the connected wallet
  const toastId = toast.loading("Claiming distribution…")
  await fakeTxDelay(1000)
  toast.success("Distribution claimed", { id: toastId, description: "Tx: DUMMY (not real)" })
  return "DUMMY_TX_HASH"
}

export function validateReferralCode(code: string): string | null {
  const upper = code.toUpperCase().trim()
  if (!upper) return "Code is required"
  if (upper.length < 3) return "Minimum 3 characters"
  if (upper.length > 16) return "Maximum 16 characters"
  if (!/^[A-Z0-9_]+$/.test(upper)) return "Only letters, numbers, and underscores allowed"
  return null
}
