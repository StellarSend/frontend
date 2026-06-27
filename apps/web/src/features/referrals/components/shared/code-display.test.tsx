import { describe, it, expect, vi, afterEach } from "vitest"
import { cleanup, render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { CodeDisplay } from "./code-display"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe("CodeDisplay", () => {
  const code = "TESTCODE123"

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("calls navigator.clipboard.writeText on click", () => {
    vi.spyOn(navigator.clipboard!, "writeText").mockResolvedValue(undefined)
    render(<CodeDisplay code={code} />)
    fireEvent.click(screen.getByRole("button", { name: /copy code/i }))
    expect(navigator.clipboard!.writeText).toHaveBeenCalledWith(code)
  })

  it("shows copied (checkmark) state after successful copy", async () => {
    vi.spyOn(navigator.clipboard!, "writeText").mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<CodeDisplay code={code} />)
    await user.click(screen.getByRole("button", { name: /copy code/i }))
    expect(screen.getByRole("button", { name: /copy code/i })).toHaveClass("text-green-400")
  })

  it("shows a success toast on successful copy", async () => {
    vi.spyOn(navigator.clipboard!, "writeText").mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<CodeDisplay code={code} />)
    await user.click(screen.getByRole("button", { name: /copy code/i }))
    expect(toast.success).toHaveBeenCalledWith("Referral code copied!")
  })

  it("falls back to execCommand when clipboard API rejects", async () => {
    vi.spyOn(navigator.clipboard!, "writeText").mockRejectedValue(
      new Error("permission denied"),
    )
    const execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand
    const user = userEvent.setup()
    render(<CodeDisplay code={code} />)
    await user.click(screen.getByRole("button", { name: /copy code/i }))
    expect(execCommand).toHaveBeenCalledWith("copy")
    expect(toast.success).toHaveBeenCalledWith("Referral code copied!")
    expect(screen.getByRole("button", { name: /copy code/i })).toHaveClass("text-green-400")
  })

  it("shows error toast when both clipboard API and fallback fail", async () => {
    vi.spyOn(navigator.clipboard!, "writeText").mockRejectedValue(
      new Error("permission denied"),
    )
    const execCommand = vi.fn(() => {
      throw new Error("execCommand failed")
    })
    document.execCommand = execCommand
    const user = userEvent.setup()
    render(<CodeDisplay code={code} />)
    await user.click(screen.getByRole("button", { name: /copy code/i }))
    expect(toast.error).toHaveBeenCalledWith("Failed to copy — please copy manually")
  })

  it("renders the code text and label", () => {
    render(<CodeDisplay code={code} label="Custom label" />)
    expect(screen.getByText(code)).toBeInTheDocument()
    expect(screen.getByText("Custom label")).toBeInTheDocument()
  })
})
