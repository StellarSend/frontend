import { act, renderHook } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { useRetry } from "./useRetry"

describe("useRetry", () => {
  it("resets loading to false after successful execution on first attempt (#4)", async () => {
    const fn = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useRetry(fn))

    expect(result.current.loading).toBe(false)

    await act(async () => {
      await result.current.run()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.attempt).toBe(0)
    expect(result.current.error).toBeNull()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("resets loading to false after successful execution on retry (#4)", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Transient error"))
      .mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useRetry(fn, { maxAttempts: 3, delay: 10 })
    )

    await act(async () => {
      await result.current.run()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.attempt).toBe(0)
    expect(result.current.error).toBeNull()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("resets loading to false and sets error message when all attempts fail", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Persistent failure"))
    const { result } = renderHook(() =>
      useRetry(fn, { maxAttempts: 2, delay: 10 })
    )

    await act(async () => {
      await result.current.run()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.attempt).toBe(2)
    expect(result.current.error).toBe("Persistent failure")
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
