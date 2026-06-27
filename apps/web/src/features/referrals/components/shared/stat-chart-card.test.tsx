import { describe, it, expect, afterEach } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { StatChartCard } from "./stat-chart-card"

describe("StatChartCard", () => {
  afterEach(cleanup)
  it("renders the title", () => {
    render(
      <StatChartCard title="Trading Volume" tooltip="Total volume" value={0} period="total" />,
    )
    expect(screen.getByText("Trading Volume")).toBeInTheDocument()
  })

  it("renders the formatted value", () => {
    render(
      <StatChartCard title="Volume" tooltip="test" value={1234.56} period="total" />,
    )
    expect(screen.getByText("$1,234.56")).toBeInTheDocument()
  })

  it("renders $0.00 for a value of 0", () => {
    render(
      <StatChartCard title="Volume" tooltip="test" value={0} period="total" />,
    )
    expect(screen.getByText("$0.00")).toBeInTheDocument()
  })

  it("renders the tooltip icon with correct title attribute", () => {
    render(
      <StatChartCard title="Volume" tooltip="Total trading volume" value={0} period="total" />,
    )
    const icon = screen.getByTitle("Total trading volume")
    expect(icon).toBeInTheDocument()
  })

  it("renders the SVG chart area", () => {
    const { container } = render(
      <StatChartCard title="Volume" tooltip="test" value={0} period="total" />,
    )
    const svg = container.querySelector('svg[aria-hidden="true"]')
    expect(svg).toBeInTheDocument()
  })

  it("renders 5 horizontal grid lines", () => {
    const { container } = render(
      <StatChartCard title="Volume" tooltip="test" value={0} period="total" />,
    )
    const lines = container.querySelectorAll('line')
    // 5 grid lines + 1 zero baseline line
    expect(lines.length).toBe(6)
  })

  it("renders 5 x-axis date labels", () => {
    const { container } = render(
      <StatChartCard title="Volume" tooltip="test" value={0} period="total" />,
    )
    const textElements = container.querySelectorAll('text')
    // 5 y-axis tick labels + 5 x-axis date labels
    const xLabels = Array.from(textElements).filter((el) => {
      const y = Number(el.getAttribute("y"))
      return y === 100
    })
    expect(xLabels.length).toBe(5)
  })

  it("renders the zero baseline line", () => {
    const { container } = render(
      <StatChartCard title="Volume" tooltip="test" value={0} period="total" />,
    )
    const lines = container.querySelectorAll('line')
    const baseline = Array.from(lines).find(
      (l) => l.getAttribute("y1") === "80" && l.getAttribute("y2") === "80",
    )
    expect(baseline).toBeInTheDocument()
  })

  it("renders the baseline with correct attributes", () => {
    const { container } = render(
      <StatChartCard title="Volume" tooltip="test" value={0} period="total" accent="blue" />,
    )
    const baseline = Array.from(container.querySelectorAll('line')).find(
      (l) => l.getAttribute("y1") === "80" && l.getAttribute("y2") === "80",
    )
    expect(baseline).toBeInTheDocument()
    expect(baseline?.getAttribute("x1")).toBe("28")
    expect(baseline?.getAttribute("x2")).toBe("396")
  })

  it("renders y-axis tick marks for values 4, 3, 2, 1, 0", () => {
    const { container } = render(
      <StatChartCard title="Volume" tooltip="test" value={0} period="total" />,
    )
    const tickTexts = Array.from(container.querySelectorAll('text')).filter(
      (t) => ["4", "3", "2", "1", "0"].includes(t.textContent ?? ""),
    )
    expect(tickTexts).toHaveLength(5)
  })

  it("renders negative value with negative sign", () => {
    render(
      <StatChartCard title="Volume" tooltip="test" value={-500} period="total" />,
    )
    expect(screen.getByText("-$500.00")).toBeInTheDocument()
  })
})
