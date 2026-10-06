import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  emptyPage,
  jsonResponse,
  page,
  renderWithRouter,
  SESSION_USER,
} from '../../../test/helpers'
import SearchPage from './SearchPage'

const PERSON = {
  id: 2,
  full_name: 'Kofi Mensah',
  country: 'GH',
  bio: 'Backend Python.',
  avatar_url: '',
  is_demo: true,
  availability: ['MENTORING'],
  offered_skills: [{ id: 6, name: 'Python', category: 'BACKEND' }],
  wanted_skills: [],
}

function stub(users: unknown[] = [PERSON]) {
  const fetchMock = vi.fn((url: string) => {
    const path = String(url)
    if (path.includes('/search/users/')) return Promise.resolve(jsonResponse(page(users)))
    if (path.includes('/search/projects/')) return Promise.resolve(jsonResponse(emptyPage()))
    if (path.includes('/countries/')) return Promise.resolve(jsonResponse({ results: [] }))
    if (path.includes('/skills/')) return Promise.resolve(jsonResponse(emptyPage()))
    return Promise.resolve(jsonResponse(SESSION_USER))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('page de recherche', () => {
  it('liste les développeurs trouvés', async () => {
    stub()
    renderWithRouter(<SearchPage />, { route: '/recherche' })

    expect(await screen.findByRole('link', { name: 'Kofi Mensah' })).toBeInTheDocument()
    expect(screen.getByText('Profil de démonstration')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
  })

  it('conserve la recherche dans l URL', async () => {
    const fetchMock = stub()
    renderWithRouter(<SearchPage />, { route: '/recherche' })
    await screen.findByRole('link', { name: 'Kofi Mensah' })

    await userEvent.type(screen.getByLabelText('Rechercher'), 'python{Enter}')

    await waitFor(() =>
      expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('q=python'))).toBe(true),
    )
  })

  it('bascule vers les projets', async () => {
    const fetchMock = stub()
    renderWithRouter(<SearchPage />, { route: '/recherche' })
    await screen.findByRole('link', { name: 'Kofi Mensah' })

    await userEvent.click(screen.getByRole('tab', { name: 'Projets' }))

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some((call) => String(call[0]).includes('/search/projects/')),
      ).toBe(true),
    )
  })

  it('propose d explorer par pays sans résultat', async () => {
    stub([])
    renderWithRouter(<SearchPage />, { route: '/recherche' })

    expect(await screen.findByText('Aucun développeur ne correspond')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explorer par pays' })).toHaveAttribute('href', '/pays')
  })

  it('réinitialise les filtres', async () => {
    stub()
    renderWithRouter(<SearchPage />, { route: '/recherche?q=python&level=ADVANCED' })
    await screen.findByRole('link', { name: 'Kofi Mensah' })

    await userEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }))

    expect(screen.getByLabelText('Niveau')).toHaveValue('')
  })
})
