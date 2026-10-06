import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithRouter } from '../../../test/helpers'
import CountriesPage from './CountriesPage'

const COUNTRIES = {
  results: [
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳', developers_count: 6, projects_count: 3 },
    { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', developers_count: 4, projects_count: 2 },
  ],
}

describe('exploration par pays', () => {
  it('affiche les pays avec leurs compteurs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(COUNTRIES)))
    renderWithRouter(<CountriesPage />)

    expect(await screen.findByText('Sénégal')).toBeInTheDocument()
    expect(screen.getByText('6 développeurs')).toBeInTheDocument()
    expect(screen.getByText('3 projets')).toBeInTheDocument()
  })

  it('lie chaque pays à sa page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(COUNTRIES)))
    renderWithRouter(<CountriesPage />)

    // La carte en tuiles et la liste mènent toutes deux au pays : on cible la
    // carte de la liste, reconnaissable à son libellé complet.
    const links = await screen.findAllByRole('link', { name: /Sénégal/ })
    expect(links.length).toBeGreaterThanOrEqual(2)
    expect(links.every((link) => link.getAttribute('href') === '/pays/SN')).toBe(true)
  })

  it('gère le cas où aucun pays n est représenté', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: [] })))
    renderWithRouter(<CountriesPage />)

    expect(await screen.findByText('Aucun pays représenté')).toBeInTheDocument()
  })
})
