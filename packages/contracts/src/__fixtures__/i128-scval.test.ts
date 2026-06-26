import { describe, expect, it } from "vitest"
import { xdr } from "@stellar/stellar-sdk"
import { i128ToScVal } from "../scval"
import fixture from "./i128-scval.json"

describe("i128ToScVal fixture decoder baseline", () => {
  it("encodes the captured fixture value to the expected ScVal shape", () => {
    const input = BigInt(fixture.input)
    const scVal = i128ToScVal(input)

    expect(scVal.switch().name).toBe(fixture.expected.type)

    const parts = scVal.i128()
    expect(parts.lo().toString()).toBe(fixture.expected.lo)
    expect(parts.hi().toString()).toBe(fixture.expected.hi)
  })

  it("round-trips via XDR base64", () => {
    const input = BigInt(fixture.input)
    const scVal = i128ToScVal(input)

    const encoded = scVal.toXDR("base64")
    const decoded = xdr.ScVal.fromXDR(encoded, "base64")

    expect(decoded.switch().name).toBe(fixture.expected.type)
    expect(decoded.i128().lo().toString()).toBe(fixture.expected.lo)
    expect(decoded.i128().hi().toString()).toBe(fixture.expected.hi)
  })

  it("encodes negative i128 values with correct hi bits", () => {
    const negativeOne = i128ToScVal(-1n)
    const parts = negativeOne.i128()
    expect(parts.hi().toString()).toBe("-1")
    expect(parts.lo().toString()).toBe("18446744073709551615")
  })
})
