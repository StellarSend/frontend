import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { Pagination } from "./Pagination"
describe("Pagination", () => {
  it("disables prev on page 1", () => {
    render(<Pagination page={1} hasMore onNext={vi.fn()} onPrev={vi.fn()} />)
    expect(screen.getByText("← Prev")).toBeDisabled()
  })
  it("disables next when no more pages", () => {
    render(<Pagination page={2} hasMore={false} onNext={vi.fn()} onPrev={vi.fn()} />)
    expect(screen.getByText("Next →")).toBeDisabled()
  })
})
