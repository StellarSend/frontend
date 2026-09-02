import { describe, it, expect } from "vitest"
import {
  validateAmount,
  validateRecipient,
  validateMemo,
  getUtf8ByteLength,
  truncateUtf8Bytes,
  MAX_MEMO_BYTES,
} from "./validation"

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

describe("validateMemo and UTF-8 byte utilities", () => {
  it("accepts short memo", () => expect(validateMemo("hello")).toBeNull())
  it("accepts exactly 28 ascii bytes", () => expect(validateMemo("a".repeat(28))).toBeNull())
  it("rejects memo over 28 ascii bytes", () => expect(validateMemo("a".repeat(29))).not.toBeNull())

  it("calculates UTF-8 byte length correctly for multibyte characters", () => {
    expect(getUtf8ByteLength("🚀")).toBe(4)
    expect(getUtf8ByteLength("cafe")).toBe(4)
    expect(getUtf8ByteLength("café")).toBe(5)
  })

  it("rejects multibyte memo exceeding 28 bytes even if char count <= 28", () => {
    // 8 emojis = 8 chars / code units, but 32 UTF-8 bytes > 28 bytes limit
    const multiByteMemo = "🚀".repeat(8)
    expect(multiByteMemo.length).toBe(16) // UTF-16 surrogate pairs count as 16, but fewer than 28 chars
    expect(getUtf8ByteLength(multiByteMemo)).toBe(32)
    expect(validateMemo(multiByteMemo)).toBe(`Max ${MAX_MEMO_BYTES} bytes`)
  })

  it("truncates UTF-8 bytes without splitting multibyte characters", () => {
    const raw = "🚀".repeat(10) // 40 bytes
    const truncated = truncateUtf8Bytes(raw, 28)
    expect(getUtf8ByteLength(truncated)).toBeLessThanOrEqual(28)
    expect(getUtf8ByteLength(truncated)).toBe(28)
    expect(truncated).toBe("🚀".repeat(7)) // 7 * 4 = 28 bytes
  })
})
