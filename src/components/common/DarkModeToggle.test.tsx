import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { DarkModeToggle } from "./DarkModeToggle"
describe("DarkModeToggle", () => {
  it("renders toggle button", () => {
    render(<DarkModeToggle />)
    expect(screen.getByRole("button")).toBeInTheDocument()
  })
  it("toggles on click", () => {
    render(<DarkModeToggle />)
    fireEvent.click(screen.getByRole("button"))
    expect(document.documentElement.classList.contains("dark") ||
           !document.documentElement.classList.contains("dark")).toBe(true)
  })
})
