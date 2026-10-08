import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithRouter, routeFetch } from '../test/helpers'
import HomePage from './HomePage'

const COUNTRIES = {
  results: [
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳', developers_count: 3, projects_count: 1 },
    { code: 'ML', name: 'Mali', flag: '🇲🇱', developers_count: 1, projects_count: 0 },
    { code: 'CM', name: 'Cameroun', flag: '🇨🇲', developers_count: 2, projects_count: 2 },
  ],
}

describe("page d'accueil", () => {
  it('propose de créer un compte à un visiteur', async () => {
    vi.stubGlobal('fetch', routeFetch({ '/countries/': COUNTRIES }))
    renderWithRouter(<HomePage />)

    expect(
      await screen.findByRole('heading', { name: /Apprenez ce qui vous manque/ }),
    ).toBeInTheDocument()
    // Le bouton existe deux fois : dans la bannière, et dans la bande finale
    // (réservée aux visiteurs non connectés).
    expect(screen.getAllByRole('link', { name: 'Créer mon compte' })).toHaveLength(2)
    expect(
      screen.getByRole('heading', { name: 'Prêt à échanger vos compétences ?' }),
    ).toBeInTheDocument()
  })

  it("propose d'aller voir ses matchs à une personne connectée, sans la bande finale", async () => {
    vi.stubGlobal('fetch', routeFetch({ '/countries/': COUNTRIES }))
    renderWithRouter(<HomePage />, { authenticated: true })

    expect(await screen.findByRole('link', { name: 'Voir mes matchs' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Créer mon compte' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Prêt à échanger vos compétences ?' }),
    ).not.toBeInTheDocument()
  })

  it('affiche les pays les plus actifs, triés par présence réelle', async () => {
    vi.stubGlobal('fetch', routeFetch({ '/countries/': COUNTRIES }))
    renderWithRouter(<HomePage />)

    const heading = await screen.findByRole('heading', { name: "Présent dans toute l'Afrique" })
    const section = heading.closest('section') as HTMLElement
    const list = section.querySelector('ul') as HTMLElement
    const names = Array.from(list.querySelectorAll('a')).map((link) => link.textContent)

    // Sénégal (3+1=4) avant Cameroun (2+2=4 aussi, mais apparaît après dans la
    // donnée d'origine) avant Mali (1+0=1).
    expect(names[0]).toContain('Sénégal')
    expect(names[2]).toContain('Mali')
  })

  it("dit honnêtement qu'aucun pays n'a encore de présence, plutôt que d'inventer un chiffre", async () => {
    vi.stubGlobal('fetch', routeFetch({ '/countries/': { results: [] } }))
    renderWithRouter(<HomePage />)

    expect(await screen.findByText(/Personne n'a encore renseigné son pays/)).toBeInTheDocument()
  })
})
