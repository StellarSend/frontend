/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Buffer is polyfilled onto window at runtime (see src/main.tsx) so the
// Stellar SDK works in the browser.
interface Window {
  Buffer?: typeof globalThis.Buffer
}
