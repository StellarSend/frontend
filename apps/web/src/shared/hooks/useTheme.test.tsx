import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ThemeToggle } from "@/ui/theme-toggle"
import { ThemeProvider, useTheme } from "@/ui/theme-provider"

const STORAGE_KEY = "so4-theme"

function createStorageMock() {
  const store = new Map<string, string>()

  return {
    clear: vi.fn(() => store.clear()),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
  }
}

function ThemeProbe() {
  const { resolvedTheme, setTheme, theme } = useTheme()

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button type="button" onClick={() => setTheme("dark")}>
        Set dark
      </button>
    </div>
  )
}

describe("useTheme", () => {
  let storage: ReturnType<typeof createStorageMock>
  let originalLocalStorage: PropertyDescriptor | undefined
  let originalMatchMedia: PropertyDescriptor | undefined

  beforeEach(() => {
    originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage")
    originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia")
    storage = createStorageMock()

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: storage,
    })
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: false,
        media: "(prefers-color-scheme: dark)",
        removeEventListener: vi.fn(),
      }),
    })
    document.documentElement.className = ""
  })

  afterEach(() => {
    cleanup()
    document.documentElement.className = ""
    storage.clear()
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", originalLocalStorage)
    } else {
      delete (globalThis as { localStorage?: Storage }).localStorage
    }
    if (originalMatchMedia) {
      Object.defineProperty(window, "matchMedia", originalMatchMedia)
    } else {
      delete (window as { matchMedia?: Window["matchMedia"] }).matchMedia
    }
    vi.restoreAllMocks()
  })

  it("defaults to the system theme and applies the resolved document class", async () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    expect(screen.getByTestId("theme")).toHaveTextContent("system")
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light")

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("light")
    })
    expect(storage.getItem).toHaveBeenCalledWith(STORAGE_KEY)
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it("toggles between light and dark themes and persists the choice", async () => {
    storage.getItem.mockReturnValue("light")
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeToggle />
        <ThemeProbe />
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("light")
    })

    await user.click(screen.getByRole("button", { name: /toggle theme/i }))

    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, "dark")
    expect(screen.getByTestId("theme")).toHaveTextContent("dark")
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark")

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark")
      expect(document.documentElement).not.toHaveClass("light")
    })
  })

  it("sets an explicit theme, persists it, and updates the document class", async () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    act(() => {
      screen.getByRole("button", { name: /set dark/i }).click()
    })

    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, "dark")
    expect(screen.getByTestId("theme")).toHaveTextContent("dark")
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark")

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark")
    })
  })

  it("hydrates from a persisted theme value", async () => {
    storage.getItem.mockReturnValue("dark")

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    expect(screen.getByTestId("theme")).toHaveTextContent("dark")
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark")

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark")
    })
  })
})
