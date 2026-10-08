import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithRouter } from '../../../test/helpers'
import CountryDetailPage from './CountryDetailPage'

const SENEGAL = {
  code: 'SN',
  name: 'Sénégal',
  flag: '🇸🇳',
  developers_count: 2,
  projects_count: 1,
  top_skills: [{ id: 1, name: 'Python', count: 2 }],
  developers: [
    {
      id: 2,
      full_name: 'Mamadou Bâ',
      country: 'SN',
      bio: 'Back-end Python.',
      avatar_url: '',
      is_demo: true,
      availability: ['MENTORING'],
      offered_skills: [{ id: 1, name: 'Python', category: 'BACKEND' }],
      wanted_skills: [],
    },
  ],
  projects: [
    {
      id: 4,
      title: 'Agri-Collecte',
      description: 'Collecte de données agricoles hors ligne.',
      status: 'OPEN',
      needs: [],
      repo_url: '',
      demo_url: '',
      owner: { id: 2, full_name: 'Mamadou Bâ', country: 'SN', is_demo: true },
      join_requests_count: 0,
      created_at: '',
      updated_at: '',
    },
  ],
}

function renderCountry(code: string, response: Response) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
  return renderWithRouter(
    <Routes>
      <Route path="/pays/:code" element={<CountryDetailPage />} />
    </Routes>,
    { route: `/pays/${code}` },
  )
}

describe("page d'un pays", () => {
  it('présente les développeurs, les technologies et les projets du pays', async () => {
    renderCountry('SN', jsonResponse(SENEGAL))

    expect(await screen.findByRole('heading', { level: 1, name: 'Sénégal' })).toBeInTheDocument()
    expect(screen.getByText(/2 développeurs · 1 projet/)).toBeInTheDocument()
    // Mamadou apparaît comme développeur et comme porteur du projet.
    const links = screen.getAllByRole('link', { name: 'Mamadou Bâ' })
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/developpeurs/2',
      '/developpeurs/2',
    ])
    expect(screen.getByRole('link', { name: 'Agri-Collecte' })).toHaveAttribute(
      'href',
      '/projets/4',
    )
    expect(screen.getAllByText('Profil de démonstration').length).toBeGreaterThan(0)
  })

  it('invite à être le premier quand personne ne vient encore de ce pays', async () => {
    renderCountry(
      'TD',
      jsonResponse({
        ...SENEGAL,
        code: 'TD',
        name: 'Tchad',
        developers_count: 0,
        projects_count: 0,
        top_skills: [],
        developers: [],
        projects: [],
      }),
    )

    expect(await screen.findByText('Personne encore inscrit depuis Tchad')).toBeInTheDocument()
  })

  it('dit clairement quand le code pays est inconnu, sans proposer de réessayer', async () => {
    renderCountry('XX', jsonResponse({ detail: 'Code pays inconnu.' }, 400))

    expect(await screen.findByText("Ce code pays n'est pas reconnu.")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Réessayer/ })).not.toBeInTheDocument()
  })
})
