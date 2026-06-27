import { expect, test } from "@playwright/test"

// /faucet smoke test.
// Verifies the faucet route boots and its core content is reachable without
// ever connecting a real wallet — the page renders token cards and a
// "Connect wallet" call to action by default, with no wallet extension
// installed in the test browser.
//
// Note: the page has two "Connect wallet" buttons at once (one in the
// navbar, one in the claim panel) when no wallet is connected, so the
// navbar one is scoped out via .first() to avoid a strict-mode match on
// more than one element.

test("faucet page is reachable", async ({ page }) => {
  await page.goto("/faucet")

  await expect(page.getByRole("heading", { name: "Testnet Faucet" })).toBeVisible()
  await expect(page.getByText("Claim test tokens to try trading on SO4.")).toBeVisible()

  // Token cards: each renders its symbol, name, and a per-token Claim
  // button immediately — these don't depend on the live RPC balance data
  // still loading in the background, so the assertion stays stable.
  await expect(page.getByText("Test USDC")).toBeVisible()
  await expect(page.getByText("Test Bitcoin")).toBeVisible()
  await expect(page.getByText("Test Ether")).toBeVisible()
  await expect(page.getByText("Test Stellar Lumens")).toBeVisible()
  await expect(page.getByRole("button", { name: "Claim" })).toHaveCount(4)

  // Connect-wallet call to action — no real wallet extension is required
  // for any of this to be visible.
  await expect(page.getByText("Connect your wallet to claim test tokens.")).toBeVisible()
  await expect(page.getByRole("button", { name: /connect wallet/i }).first()).toBeVisible()
})