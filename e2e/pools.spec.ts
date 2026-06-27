import { expect, test } from "@playwright/test"

// /pools smoke test — catches browser-only crashes (errors that only show
// up once real DOM APIs run, which unit tests with jsdom can't catch).
//
// The pools page's current data path (usePoolsData / GmPoolsTable) is fully
// static (POOL_MARKETS, no live fetch yet — the "live Soroban calls" banner
// text on the page is ahead of the current implementation), so nothing here
// actually needs network access today. The same third-party/RPC endpoints
// used elsewhere in the app (Binance, SO4's oracle proxy) are blocked
// anyway as a safety net, so this test stays network-independent even once
// the table is wired to real data.

test.beforeEach(async ({ page }) => {
  await page.route("**/api.binance.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  )
  await page.route("**/oracle.biscotti-proxy-worker.workers.dev/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  )
})

test("pools page is reachable with no external network dependency", async ({ page }) => {
  await page.goto("/pools")

  // Page heading.
  await expect(page.getByRole("heading", { name: "Pools", level: 1 })).toBeVisible()

  // Pool table — column headers plus at least the first configured market.
  await expect(page.getByRole("table")).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Pool" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "TVL" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "APR" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "BTC/USD" })).toBeVisible()

  // Range filter — defaults to 30D.
  await expect(page.getByRole("tab", { name: "Total" })).toBeVisible()
  await expect(page.getByRole("tab", { name: "7D" })).toBeVisible()
  await expect(page.getByRole("tab", { name: "30D", exact: true })).toBeVisible()
  await expect(page.getByRole("tab", { name: "90D" })).toBeVisible()
  await expect(page.getByRole("tab", { name: "30D", exact: true })).toHaveAttribute(
    "data-state",
    "active",
  )
})