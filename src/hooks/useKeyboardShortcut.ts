import { useEffect } from "react"
type Modifier = "ctrl" | "meta" | "alt" | "shift"
interface Options { modifier?: Modifier; enabled?: boolean }
export function useKeyboardShortcut(key: string, callback: () => void, { modifier, enabled = true }: Options = {}) {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      const modOk = !modifier ||
        (modifier === "ctrl" && e.ctrlKey) ||
        (modifier === "meta" && e.metaKey) ||
        (modifier === "alt"  && e.altKey)  ||
        (modifier === "shift" && e.shiftKey)
      if (modOk && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault(); callback()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [key, callback, modifier, enabled])
}
