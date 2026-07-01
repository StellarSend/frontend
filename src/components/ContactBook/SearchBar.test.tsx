import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SearchBar } from "./SearchBar"
describe("SearchBar", () => {
  it("renders search input", () => {
    render(<SearchBar value="" onChange={vi.fn()} />)
    expect(screen.getByPlaceholderText(/search contacts/i)).toBeInTheDocument()
  })
  it("calls onChange on input", () => {
    const fn = vi.fn()
    render(<SearchBar value="" onChange={fn} />)
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Tunde" } })
    expect(fn).toHaveBeenCalledWith("Tunde")
  })
})
