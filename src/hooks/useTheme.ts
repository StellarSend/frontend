import { useLocalStorage } from './useLocalStorage'
import { useEffect } from 'react'
type Theme = 'light' | 'dark' | 'system'
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('ss-theme', 'system')
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else if (theme === 'light') root.classList.remove('dark')
    else root.classList.toggle('dark', matchMedia('(prefers-color-scheme: dark)').matches)
  }, [theme])
  return { theme, setTheme }
}
