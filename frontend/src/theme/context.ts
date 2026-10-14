import { createContext } from 'react'

export type Theme = 'light' | 'dark'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

/** Valeur par défaut : clair, sans fournisseur (composants rendus seuls en test). */
export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
})
