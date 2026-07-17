import { useLocalStorage } from './useLocalStorage'
import { useIsDarkMode } from './useMediaQuery'
import { useEffect } from 'react'
type Theme = 'light' | 'dark' | 'system'
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('ss-theme', 'system')
  const systemIsDark = useIsDarkMode()
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else if (theme === 'light') root.classList.remove('dark')
    else root.classList.toggle('dark', systemIsDark)
  }, [theme, systemIsDark])
  return { theme, setTheme }
}
