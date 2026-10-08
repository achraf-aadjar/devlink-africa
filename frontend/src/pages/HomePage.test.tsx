import { screen } from '@testing-library/react'
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
      'Quatre façons de travailler ensemble',
      'Pensé pour que les deux côtés y gagnent',
    ]) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('link', { name: 'Créer mon compte' })[0]).toHaveAttribute(
      'href',
      '/inscription',
    )
    // Sans IntersectionObserver (jsdom), le contenu animé reste visible.
    expect(screen.getByRole('heading', { name: 'Revue de code' }).closest('.reveal')).toHaveClass(
      'is-visible',
    )
  })

  it("additionne le score d'exemple comme l'API : la somme des points", () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithRouter(<HomePage />)

    expect(screen.getByText('82.5')).toBeInTheDocument()
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
