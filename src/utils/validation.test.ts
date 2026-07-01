import { describe, it, expect } from "vitest"
import { validateAmount, validateRecipient, validateMemo } from "./validation"
const VALID_ADDR = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
describe("validateAmount", () => {
  it("rejects empty string", () => expect(validateAmount("")).not.toBeNull())
  it("rejects zero", () => expect(validateAmount("0")).not.toBeNull())
  it("rejects negative", () => expect(validateAmount("-1")).not.toBeNull())
  it("rejects below minimum", () => expect(validateAmount("0.001")).not.toBeNull())
  it("accepts valid amount", () => expect(validateAmount("10")).toBeNull())
})
describe("validateRecipient", () => {
  it("rejects empty", () => expect(validateRecipient("")).not.toBeNull())
  it("rejects invalid address", () => expect(validateRecipient("invalid")).not.toBeNull())
  it("accepts valid G address", () => expect(validateRecipient(VALID_ADDR)).toBeNull())
})
describe("validateMemo", () => {
  it("accepts short memo", () => expect(validateMemo("hello")).toBeNull())
  it("rejects memo over 28 chars", () => expect(validateMemo("a".repeat(29))).not.toBeNull())
})
