import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Newer Node versions ship an experimental global `localStorage` accessor
// that shadows jsdom's own implementation and throws (without a
// --localstorage-file flag) whenever code touches window.localStorage or the
// bare `localStorage` identifier. Replace it with a small in-memory Storage
// polyfill so hooks like useLocalStorage/useTheme work under test regardless
// of the host Node version's experimental-webstorage flag.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

const memoryStorage = new MemoryStorage()
for (const target of [globalThis, window]) {
  Object.defineProperty(target, 'localStorage', {
    value: memoryStorage,
    writable: true,
    configurable: true,
  })
}

afterEach(() => memoryStorage.clear())

// jsdom does not implement matchMedia — polyfill it so hooks like useTheme
// (which check `prefers-color-scheme`) don't crash under test.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

afterEach(() => { cleanup() })
