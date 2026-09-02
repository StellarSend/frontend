import { useEffect } from 'react'

export type Modifier = 'ctrl' | 'meta' | 'alt' | 'shift'

export interface UseKeyboardShortcutOptions {
  modifier?: Modifier | Modifier[]
  enabled?: boolean
  allowInInputs?: boolean
}

function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false
  const tagName = element.tagName.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.isContentEditable
  )
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  { modifier, enabled = true, allowInInputs = false }: UseKeyboardShortcutOptions = {}
) {
  useEffect(() => {
    if (!enabled) return

    const handler = (e: KeyboardEvent) => {
      if (!allowInInputs && isInputElement(e.target)) {
        return
      }

      const expectedModifiers: Record<Modifier, boolean> = {
        ctrl: false,
        meta: false,
        alt: false,
        shift: false,
      }

      if (Array.isArray(modifier)) {
        modifier.forEach((m) => {
          expectedModifiers[m] = true
        })
      } else if (modifier) {
        expectedModifiers[modifier] = true
      }

      const ctrlMatches = e.ctrlKey === expectedModifiers.ctrl
      const metaMatches = e.metaKey === expectedModifiers.meta
      const altMatches = e.altKey === expectedModifiers.alt
      const shiftMatches = e.shiftKey === expectedModifiers.shift

      const modifiersMatch = ctrlMatches && metaMatches && altMatches && shiftMatches

      if (modifiersMatch && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback, modifier, enabled, allowInInputs])
}
