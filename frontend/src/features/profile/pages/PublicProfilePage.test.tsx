import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithRouter, SESSION_USER } from '../../../test/helpers'
import PublicProfilePage from './PublicProfilePage'

const PROFILE = {
  id: 2,
  full_name: 'Kofi Mensah',
  country: 'GH',
  bio: 'Backend Python.',
  availability: ['MENTORING'],
  domains: ['WEB'],
  avatar_url: '',
  is_demo: true,
  skills: {
    offered: [
      {
        id: 11,
        skill: { id: 6, name: 'Python', category: 'BACKEND' },
        kind: 'OFFERED',
        level: 'ADVANCED',
        proofs_count: 1,
      },
    ],
    wanted: [
      {
        id: 12,
        skill: { id: 3, name: 'TypeScript', category: 'FRONTEND' },
        kind: 'WANTED',
        level: 'BEGINNER',
        proofs_count: 0,
      },
    ],
  },
  projects: [{ id: 4, title: 'Agri-Data', status: 'OPEN' }],
}

function renderProfile(payload: unknown = PROFILE, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(
        String(url).includes('/users/2/')
          ? jsonResponse(payload, status)
          : jsonResponse(SESSION_USER),
      ),
    ),
  )

  return renderWithRouter(
    <Routes>
      <Route path="/developpeurs/:id" element={<PublicProfilePage />} />
    </Routes>,
    { route: '/developpeurs/2' },
  )
}

describe('profil public', () => {
  it('affiche les deux listes de compétences', async () => {
    renderProfile()

    expect(await screen.findByRole('heading', { name: 'Kofi Mensah' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sait faire' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Veut apprendre' })).toBeInTheDocument()
  })

  it('n expose jamais l adresse e-mail', async () => {
    renderProfile()

    await screen.findByRole('heading', { name: 'Kofi Mensah' })
    expect(screen.queryByText(/@/)).not.toBeInTheDocument()
  })

  it('étiquette un profil de démonstration', async () => {
    renderProfile()

    expect(await screen.findByText('Profil de démonstration')).toBeInTheDocument()
  })

  it('affiche les projets du développeur', async () => {
    renderProfile()

    expect(await screen.findByRole('link', { name: 'Agri-Data' })).toBeInTheDocument()
  })

  it('explique clairement un profil inexistant', async () => {
    renderProfile({ detail: 'Introuvable.', code: 'not_found' }, 404)

    expect(await screen.findByRole('alert')).toHaveTextContent("Ce profil n'existe pas.")
  })

  it('montre les compétences validées par des pairs, avec qui et comment', async () => {
    const endorsed = structuredClone(PROFILE)
    endorsed.skills.offered[0] = {
      ...endorsed.skills.offered[0],
      endorsements: [
        {
          id: 5,
          by: { id: 3, full_name: 'Ada Lovelace', country: 'SN' },
          context: 'EXCHANGE',
          comment: 'Patient et clair.',
          created_at: '2026-10-09T10:00:00Z',
        },
      ],
    } as (typeof endorsed.skills.offered)[number]
    renderProfile(endorsed)

    const section = await screen.findByRole('region', { name: 'Validé par ses pairs' })
    expect(section).toHaveTextContent('validée par 1 pair')
    expect(section).toHaveTextContent('« Patient et clair. »')
    expect(section).toHaveTextContent('après un échange')
    expect(screen.getByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute(
      'href',
      '/developpeurs/3',
    )
  })

  it("n'affiche pas la section quand aucune compétence n'est validée", async () => {
    renderProfile()

    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('region', { name: 'Validé par ses pairs' })).not.toBeInTheDocument()
  })
})
