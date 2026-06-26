/**
 * Proves that the MSW `onUnhandledRequest: "error"` guard is active.
 *
 * The vitest setup (vitest.setup.ts) starts the server with this option, which
 * means any fetch to a URL that has no registered handler will throw instead of
 * silently passing through to the real network.
 *
 * How to add a new handler when you extend the app's network calls:
 *   1. Open `apps/web/test/msw/handlers.ts`.
 *   2. Add an `http.get` / `http.post` / etc. entry for the new URL.
 *   3. Return an `HttpResponse.json(...)` with the shape your code expects.
 *
 * For one-off test overrides, use `server.use(http.get(...))` inside the test
 * itself — `afterEach` in vitest.setup.ts calls `server.resetHandlers()` so
 * temporary handlers are cleaned up automatically after each test.
 */
import { describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "./server"

describe("MSW unhandled-request guard", () => {
  it("rejects fetches to URLs with no registered handler", async () => {
    // Suppress the MSW console.error for this intentional negative test
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    try {
      await expect(
        fetch("https://no-handler.example.test/data"),
      ).rejects.toThrow()
    } finally {
      consoleError.mockRestore()
    }
  })

  it("resolves when a temporary handler is added via server.use()", async () => {
    server.use(
      http.get("https://dynamic.example.test/api", () =>
        HttpResponse.json({ ok: true }),
      ),
    )

    const res = await fetch("https://dynamic.example.test/api")
    const data = await res.json()

    expect(data).toEqual({ ok: true })
    // afterEach in vitest.setup.ts calls server.resetHandlers(), so this
    // temporary handler is removed after the test — no manual cleanup needed.
  })
})
