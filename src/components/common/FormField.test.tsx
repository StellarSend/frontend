import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { FormField } from "./FormField"
describe("FormField", () => {
  it("renders label", () => {
    render(<FormField label="Amount"><input /></FormField>)
    expect(screen.getByText("Amount")).toBeInTheDocument()
  })
  it("shows error message", () => {
    render(<FormField label="Amount" error="Required"><input /></FormField>)
    expect(screen.getByText("Required")).toBeInTheDocument()
  })
  it("shows hint when no error", () => {
    render(<FormField label="Amount" hint="Min 0.01 XLM"><input /></FormField>)
    expect(screen.getByText("Min 0.01 XLM")).toBeInTheDocument()
  })
  it("renders required asterisk", () => {
    render(<FormField label="Amount" required><input /></FormField>)
    expect(screen.getByText("*")).toBeInTheDocument()
  })
})
