import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { PoolCompositionBar } from "./pool-composition-bar"

afterEach(() => {
  cleanup()
})

function getLongBar(): HTMLElement | null {
  return document.querySelector(".bg-cyan-500")
}

function getShortBar(): HTMLElement | null {
  return document.querySelector(".bg-emerald-500")
}

describe("PoolCompositionBar", () => {
  it("renders labels and percentages for a normal two-token split", () => {
    render(<PoolCompositionBar longPct={60} shortPct={40} longSymbol="BTC" shortSymbol="USDC" />)

    expect(screen.getByText("BTC 60%")).toBeInTheDocument()
    expect(screen.getByText("USDC 40%")).toBeInTheDocument()
  })

  it("renders an equal 50/50 split", () => {
    render(<PoolCompositionBar longPct={50} shortPct={50} longSymbol="ETH" shortSymbol="USDC" />)

    expect(screen.getByText("ETH 50%")).toBeInTheDocument()
    expect(screen.getByText("USDC 50%")).toBeInTheDocument()
  })

  it("renders zero percent for the long side", () => {
    render(<PoolCompositionBar longPct={0} shortPct={100} longSymbol="BTC" shortSymbol="USDC" />)

    expect(screen.getByText("BTC 0%")).toBeInTheDocument()
    expect(screen.getByText("USDC 100%")).toBeInTheDocument()
  })

  it("renders zero percent for the short side", () => {
    render(<PoolCompositionBar longPct={100} shortPct={0} longSymbol="ETH" shortSymbol="USDC" />)

    expect(screen.getByText("ETH 100%")).toBeInTheDocument()
    expect(screen.getByText("USDC 0%")).toBeInTheDocument()
  })

  it("clamps values below 0 to 0", () => {
    render(<PoolCompositionBar longPct={-20} shortPct={120} longSymbol="BTC" shortSymbol="USDC" />)

    expect(screen.getByText("BTC 0%")).toBeInTheDocument()
    expect(screen.getByText("USDC 100%")).toBeInTheDocument()
  })

  it("clamps values above 100 to 100", () => {
    render(<PoolCompositionBar longPct={150} shortPct={-50} longSymbol="ETH" shortSymbol="USDC" />)

    expect(screen.getByText("ETH 100%")).toBeInTheDocument()
    expect(screen.getByText("USDC 0%")).toBeInTheDocument()
  })

  it("sets bar widths via inline style", () => {
    render(<PoolCompositionBar longPct={75} shortPct={25} longSymbol="BTC" shortSymbol="USDC" />)

    expect(getLongBar()).toHaveStyle({ width: "75%" })
    expect(getShortBar()).toHaveStyle({ width: "25%" })
  })

  it("handles fractional percentages", () => {
    render(<PoolCompositionBar longPct={33.3} shortPct={66.7} longSymbol="BTC" shortSymbol="USDC" />)

    expect(screen.getByText("BTC 33%")).toBeInTheDocument()
    expect(screen.getByText("USDC 67%")).toBeInTheDocument()
  })
})
