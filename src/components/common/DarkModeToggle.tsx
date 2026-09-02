import React from "react"
import { useTheme } from "../../hooks/useTheme"
export function DarkModeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-navy-700 transition-colors"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  )
}
