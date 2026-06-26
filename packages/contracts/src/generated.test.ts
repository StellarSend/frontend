import { describe, expect, it } from "vitest"
import * as ExchangeRouterGenerated from "./generated/exchange-router/src"
import * as SyntheticsReaderGenerated from "./generated/synthetics-reader/src"
import * as GlvRouterGenerated from "./generated/glv-router/src"
import * as TestFaucetGenerated from "./generated/test-faucet/src"
import * as TestTokenGenerated from "./generated/test-token/src"

describe("generated binding smoke tests", () => {
  it("exchange-router generated package exports a Client constructor", () => {
    expect(ExchangeRouterGenerated.Client).toBeDefined()
    expect(typeof ExchangeRouterGenerated.Client).toBe("function")
  })

  it("synthetics-reader generated package exports a Client constructor", () => {
    expect(SyntheticsReaderGenerated.Client).toBeDefined()
    expect(typeof SyntheticsReaderGenerated.Client).toBe("function")
  })

  it("glv-router generated package exports a Client constructor", () => {
    expect(GlvRouterGenerated.Client).toBeDefined()
    expect(typeof GlvRouterGenerated.Client).toBe("function")
  })

  it("test-faucet generated package exports a Client constructor", () => {
    expect(TestFaucetGenerated.Client).toBeDefined()
    expect(typeof TestFaucetGenerated.Client).toBe("function")
  })

  it("test-token generated package exports a Client constructor", () => {
    expect(TestTokenGenerated.Client).toBeDefined()
    expect(typeof TestTokenGenerated.Client).toBe("function")
  })

  it("generated packages export Errors maps", () => {
    expect(TestFaucetGenerated.Errors).toBeDefined()
    expect(TestTokenGenerated.Errors).toBeDefined()
  })
})
