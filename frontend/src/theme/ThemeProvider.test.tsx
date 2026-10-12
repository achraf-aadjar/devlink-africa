import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ThemeProvider from './ThemeProvider'
import { useTheme } from './useTheme'

function Probe() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button type="button" onClick={toggleTheme}>
      {theme}
    </button>
  )
}

afterEach(() => {
  delete document.documentElement.dataset.theme
  localStorage.removeItem('devlink.theme')
})

describe('fournisseur de thème', () => {
  it('part du thème clair par défaut et pose data-theme au clic', async () => {
    render(
      <ThemeProvider initial="light">
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByRole('button')).toHaveTextContent('light')
    expect(document.documentElement.dataset.theme).toBe('light')

    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveTextContent('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('reprend le thème mémorisé', () => {
    localStorage.setItem('devlink.theme', 'dark')

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByRole('button')).toHaveTextContent('dark')
  })

  it('sans choix mémorisé, laisse data-theme absent (suit l’appareil via CSS)', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    expect(document.documentElement.dataset.theme).toBeUndefined()
    vi.unstubAllGlobals()
  })
})
