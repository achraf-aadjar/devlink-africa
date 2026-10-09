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

  it('centrent toutes les pages sur une largeur fixe, comme un container Bootstrap', () => {
    for (const Shell of [StandardPage, WidePage]) {
      const { container, unmount } = renderShell(Shell)
      expect(container.querySelector('.max-w-\\[1170px\\]')).not.toBeNull()
      unmount()
    }
  })
})
