import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Country } from '../../../lib/types'
import AfricaTileMap from './AfricaTileMap'

const COUNTRIES: Country[] = [
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', developers_count: 6, projects_count: 3 },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', developers_count: 0, projects_count: 0 },
]

function renderMap(countries = COUNTRIES) {
  return render(
    <MemoryRouter>
      <AfricaTileMap countries={countries} />
    </MemoryRouter>,
  )
}

describe('carte en tuiles', () => {
  it('décrit un pays peuplé avec ses compteurs', () => {
    renderMap()

    expect(
      screen.getByRole('link', { name: 'Sénégal : 6 développeur(s), 3 projet(s)' }),
    ).toHaveAttribute('href', '/pays/SN')
  })

  it('garde les pays sans donnée cliquables', () => {
    renderMap()

    const empty = screen.getByRole('link', {
      name: "Côte d'Ivoire : aucune inscription pour le moment",
    })
    expect(empty).toHaveAttribute('href', '/pays/CI')
  })

  it('affiche tout le continent, même sans aucune donnée', () => {
    renderMap([])

    // 54 pays d'Afrique placés dans la grille.
    expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(50)
  })

  it('porte un nom accessible pour le groupe', () => {
    renderMap()

    expect(screen.getByRole('group', { name: "Carte de l'Afrique par pays" })).toBeInTheDocument()
  })

  it('utilise le code pays comme libellé visible', () => {
    renderMap()

    expect(screen.getByText('SN')).toBeInTheDocument()
  })
})
