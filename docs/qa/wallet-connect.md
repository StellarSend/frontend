# Wallet Connect — Manual QA Checklist

## Prerequisites

- Freighter wallet extension installed in the browser
- Wallet funded with testnet XLM (use [Friendbot](https://friendbot.stellar.org/) or the faucet link in the AccountBadge dropdown)
- App running on **testnet** (`VITE_NETWORK=testnet`)

---

### 1. Connect Freighter on testnet

- [ ] Click **Connect** button in the navbar
- [ ] Wallet modal opens listing available wallets
- [ ] Click **Freighter** in the modal
- [ ] Freighter extension prompts for approval
- [ ] After approval, modal closes and button changes to show connected address

### 2. Verify address displays correctly

- [ ] Connected address shown in navbar with green dot
- [ ] Address is truncated (e.g., `GABCDE…12345`)
- [ ] Green dot indicates connected status

### 3. Verify XLM balance loads

- [ ] Open AccountBadge dropdown (click the address)
- [ ] XLM balance is displayed
- [ ] Balance matches the wallet's actual testnet balance
- [ ] Balance updates after receiving/sending XLM (within 15 s)

### 4. Disconnect → Reconnect

- [ ] Click disconnect in the AccountBadge dropdown
- [ ] Button reverts to **Connect**
- [ ] Wallet store clears (address, balance reset)
- [ ] Click **Connect** again → Freighter connects without re-approving
- [ ] Previous address is restored

### 5. Refresh page → auto-reconnect

- [ ] Wallet is connected and address displayed
- [ ] Refresh the page (`Cmd+R` / `Ctrl+R`)
- [ ] After load, address is still displayed (auto-reconnect from persisted store)
- [ ] Balance reloads within a few seconds
- [ ] No double-approval prompts from Freighter

### 6. Switch wallet → new address reflects everywhere

- [ ] Connect with Freighter
- [ ] Switch to a different Freighter account in the extension
- [ ] Refresh the page (auto-reconnect picks up the new account)
- [ ] Address in navbar updates to the new account
- [ ] Balance reflects the new account's XLM balance

---

## Edge Cases

- [ ] Disconnect → refresh → no stale address shown
- [ ] Reject wallet approval → **Connect** button remains, no broken state
- [ ] Network mismatch (Freighter on mainnet, app on testnet) → banner displayed
- [ ] Install new wallet extension while modal is open → appears in the wallet list after refresh
