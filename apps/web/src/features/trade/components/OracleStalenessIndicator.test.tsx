import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { OracleStalenessIndicator } from "./OracleStalenessIndicator"

describe("OracleStalenessIndicator", () => {
  it("renders green dot for fresh staleness", () => {
    const { container } = render(<OracleStalenessIndicator staleness="fresh" />)
    const dot = container.querySelector(".bg-green-500")
    expect(dot).toBeInTheDocument()
  })

  it("renders yellow dot for warning staleness", () => {
    const { container } = render(<OracleStalenessIndicator staleness="warning" />)
    const dot = container.querySelector(".bg-yellow-500")
    expect(dot).toBeInTheDocument()
  })

  it("renders red dot for stale staleness", () => {
    const { container } = render(<OracleStalenessIndicator staleness="stale" />)
    const dot = container.querySelector(".bg-red-500")
    expect(dot).toBeInTheDocument()
  })

  it("does not show label when showLabel is false", () => {
    render(<OracleStalenessIndicator staleness="stale" />)
    expect(screen.queryByText("Stale")).not.toBeInTheDocument()
  })

  it("shows Stale label when showLabel is true and staleness is stale", () => {
    render(<OracleStalenessIndicator staleness="stale" showLabel />)
    expect(screen.getByText("Stale")).toBeInTheDocument()
  })

  it("does not show Stale label when showLabel is true but staleness is fresh", () => {
    render(<OracleStalenessIndicator staleness="fresh" showLabel />)
    expect(screen.queryByText("Stale")).not.toBeInTheDocument()
  })

  it("does not show Stale label when showLabel is true but staleness is warning", () => {
    render(<OracleStalenessIndicator staleness="warning" showLabel />)
    expect(screen.queryByText("Stale")).not.toBeInTheDocument()
  })
})
