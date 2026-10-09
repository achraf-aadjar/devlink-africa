import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SESSION_USER, jsonResponse, renderWithRouter } from '../test/helpers'
import HomePage from './HomePage'

describe("page d'accueil", () => {
  it('présente les sections et invite un visiteur à créer un compte', async () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithRouter(<HomePage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Apprenez ce qui vous manque',
    )
    for (const name of [
      "Quatre étapes, de l'inscription au premier échange",
      'Au-delà de la paire parfaite',
      'Quatre façons de travailler ensemble',
      'Pensé pour que les deux côtés y gagnent',
    ]) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('link', { name: 'Créer mon compte' })[0]).toHaveAttribute(
      'href',
      '/inscription',
    )
    expect(screen.getByRole('table')).toHaveTextContent('Complémentarité35')
  })

  it("additionne le score d'exemple comme l'API : la somme des points", () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithRouter(<HomePage />)

    expect(screen.getByText('82.5')).toBeInTheDocument()
  })

  it('montre le cercle de démonstration et bascule toute la page en anglais', async () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithRouter(<HomePage />)

    expect(
      screen.getByRole('img', {
        name: "Cercle d'échange. Aminata Diallo apprend React à Kwame Boateng. Kwame Boateng apprend FastAPI à Imani Wanjiru. Imani Wanjiru apprend Docker à Aminata Diallo.",
      }),
    ).toBeInTheDocument()
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
    expect(
      screen.getByRole('rowheader', { name: 'Willingness to collaborate' }),
    ).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Create my account' })[0]).toHaveAttribute(
      'href',
      '/inscription',
    )
    expect(screen.queryByText(/Apprenez/)).not.toBeInTheDocument()
  })

  it('renvoie vers les matchs quand la session est ouverte', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(SESSION_USER)))
    renderWithRouter(<HomePage />, { authenticated: true })

    expect((await screen.findAllByRole('link', { name: 'Voir mes matchs' }))[0]).toHaveAttribute(
      'href',
      '/matchs',
    )
    expect(screen.queryByRole('link', { name: 'Créer mon compte' })).not.toBeInTheDocument()
  })
})
