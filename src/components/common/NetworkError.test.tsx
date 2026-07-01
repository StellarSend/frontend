import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { NetworkError } from "./NetworkError"
describe("NetworkError", () => {
  it("renders default message", () => {
    render(<NetworkError />)
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
  })
  it("renders custom message", () => {
    render(<NetworkError message="Could not reach Stellar" />)
    expect(screen.getByText("Could not reach Stellar")).toBeInTheDocument()
  })
  it("calls onRetry when button clicked", () => {
    const fn = vi.fn()
    render(<NetworkError onRetry={fn} />)
    fireEvent.click(screen.getByText("Retry"))
    expect(fn).toHaveBeenCalledOnce()
  })
  it("hides retry button when no onRetry", () => {
    render(<NetworkError />)
    expect(screen.queryByText("Retry")).not.toBeInTheDocument()
  })
})
