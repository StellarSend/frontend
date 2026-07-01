import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { RateBadge } from "./RateBadge"
describe("RateBadge", () => {
  it("renders without crashing", () => {
    render(<RateBadge />)
    expect(document.body).toBeInTheDocument()
  })
})
