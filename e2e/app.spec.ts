import { expect, test } from "@playwright/test"

// Root landing-page smoke test.
// Verifies the Playwright webServer (apps/web dev) boots and the landing page
// renders its core static content without any real network calls.
//
// Prerequisites for local runs outside CI:
//   npx playwright install --with-deps chromium
// (may require sudo depending on your environment)

test("landing page loads with hero content", async ({ page }) => {
  await page.goto("/")

  // The <h1> in the Hero section is always present regardless of wallet state
  const heading = page.getByRole("heading", { level: 1 })
  await expect(heading).toBeVisible()
  await expect(heading).toContainText("perpetual")
  await expect(heading).toContainText("on-chain.")

  // Primary CTA buttons
  await expect(page.getByRole("button", { name: /start trading/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /read the litepaper/i })).toBeVisible()
})
