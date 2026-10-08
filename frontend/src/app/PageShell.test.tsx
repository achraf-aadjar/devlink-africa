import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import StandardPage from './StandardPage'
import WidePage from './WidePage'

function renderShell(Shell: () => React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/a']}>
      <Routes>
        <Route element={<Shell />}>
          <Route
            path="a"
            element={
              <>
                <h1>Page A</h1>
                <Link to="/b">Aller en B</Link>
              </>
            }
          />
          <Route path="b" element={<h1>Page B</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('enveloppes de page', () => {
  it('affichent la page demandée, puis la suivante après navigation', async () => {
    renderShell(StandardPage)

    expect(screen.getByRole('heading', { name: 'Page A' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Aller en B' }))
    expect(screen.getByRole('heading', { name: 'Page B' })).toBeInTheDocument()
  })

  it('appliquent la largeur large aux écrans à grille', () => {
    const { container } = renderShell(WidePage)

    expect(container.querySelector('.max-w-\\[90rem\\]')).not.toBeNull()
  })

  it('gardent le décor hors de portée des lecteurs d’écran', () => {
    const { container } = renderShell(StandardPage)

    expect(container.querySelector('.bg-aurora')?.parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })
})
