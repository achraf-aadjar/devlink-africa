import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SESSION_USER, jsonResponse, renderWithRouter } from '../test/helpers'
import HomePage from './HomePage'

function SearchProbe() {
  const { search } = useLocation()
  return <p data-testid="recherche">{search}</p>
}

describe("page d'accueil", () => {
  it('présente les sections et invite un visiteur à créer un compte', async () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithRouter(<HomePage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Apprenez ce qui vous manque',
    )
    for (const name of [
      'Votre feuille de match',
      'Au-delà de la paire parfaite',
      'Quatre façons de travailler ensemble',
      'Revue de code',
    ]) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('link', { name: 'Créer mon compte' })[0]).toHaveAttribute(
      'href',
      '/inscription',
    )
  })

  it('ouvre la recherche des profils complémentaires depuis la feuille de match', async () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithRouter(
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recherche" element={<SearchProbe />} />
      </Routes>,
    )

    await userEvent.selectOptions(screen.getByLabelText('Je sais faire'), 'Python')
    await userEvent.selectOptions(screen.getByLabelText('Je veux apprendre'), 'Flutter')
    await userEvent.click(screen.getByRole('button', { name: 'Voir qui me complète' }))

    // Les personnes qui savent ce que je veux apprendre, et veulent ce que je sais.
    expect(await screen.findByTestId('recherche')).toHaveTextContent(
      'skill=Flutter&skill_wanted=Python',
    )
  })

  it("additionne le score d'exemple comme l'API : la somme des points", () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithRouter(<HomePage />)

    expect(screen.getAllByText('82,5').length).toBeGreaterThan(0)
  })

  it('montre le cercle de démonstration et bascule toute la page en anglais', async () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithRouter(<HomePage />)

    expect(
      screen.getByRole('img', {
        name: "Cercle d'échange. Aminata Diallo apprend React à Kwame Boateng. Kwame Boateng apprend FastAPI à Imani Wanjiru. Imani Wanjiru apprend Docker à Aminata Diallo.",
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Personnes fictives/).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Ouvrir l'observatoire/ })).toHaveAttribute(
      'href',
      '/observatoire',
    )

    await userEvent.click(screen.getByRole('button', { name: /Switch to English/ }))

    expect(screen.getByRole('heading', { name: 'Beyond the perfect pair' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Learn what you’re missing')
    expect(screen.getByRole('button', { name: /Passer en français/ })).toHaveAttribute('lang', 'fr')
  })

  it('s’affiche en anglais', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithRouter(<HomePage />, { lang: 'en' })

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Learn what you’re missing, teach what you know.',
    )
    expect(
      screen.getByRole('heading', { level: 2, name: /A score you can read/ }),
    ).toHaveTextContent('A score you can read, not a black box.')
    expect(screen.getByRole('heading', { name: 'Four ways to work together' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Code review' })).toBeInTheDocument()
    expect(screen.getByText('Willingness to collaborate')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Create my account' })[0]).toHaveAttribute(
      'href',
      '/inscription',
    )
    expect(screen.queryByText(/Apprenez/)).not.toBeInTheDocument()
  })

  it('renvoie vers les matchs quand la session est ouverte', async () => {
    // Une réponse neuve par appel : la page charge aussi le catalogue.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse(SESSION_USER))),
    )
    renderWithRouter(<HomePage />, { authenticated: true })

    expect((await screen.findAllByRole('link', { name: 'Voir mes matchs' }))[0]).toHaveAttribute(
      'href',
      '/matchs',
    )
    expect(screen.queryByRole('link', { name: 'Créer mon compte' })).not.toBeInTheDocument()
  })
})
