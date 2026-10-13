import { useContext } from 'react'
import { ThemeContext } from './context'

/** `const { theme, setTheme, toggleTheme } = useTheme()` */
export function useTheme() {
  return useContext(ThemeContext)
}
