import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Skeleton, TransactionSkeleton } from "./Skeleton"
describe("Skeleton", () => {
  it("renders correct number of rows", () => {
    const { container } = render(<Skeleton rows={3} />)
    expect(container.querySelectorAll(".animate-pulse > div")).toHaveLength(3)
  })
})
describe("TransactionSkeleton", () => {
  it("renders without error", () => {
    const { container } = render(<TransactionSkeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
