import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithRouter, SESSION_USER } from '../../../test/helpers'
import DashboardPage from './DashboardPage'

const FULL = {
  profile_completeness: 80,
  has_contact: false,
  recommended_matches: [
    {
      id: 31,
      user: { id: 2, full_name: 'Kofi Mensah', country: 'GH', avatar_url: '', is_demo: false },
      score: 82.5,
      reasons: ['Kofi peut vous apprendre Python.'],
      computed_at: '2026-10-15T09:00:00Z',
    },
  ],
  pending_exchanges: {
    received: 1,
    sent: 0,
    items: [
      {
        id: 9,
        type: 'MENTORAT',
        status: 'PROPOSED',
        message: 'Bonjour',
        skill: null,
        requester: { id: 2, full_name: 'Kofi Mensah' },
        partner: { id: 1, full_name: 'Ada Lovelace' },
        scheduled_at: null,
        created_at: '',
        updated_at: '',
      },
    ],
  },
  pending_join_requests: {
    count: 1,
    items: [
      {
        id: 7,
        project: 4,
        applicant: { id: 3, full_name: 'Fatou Kone' },
        message: 'Bonjour',
        status: 'PENDING',
        created_at: '',
      },
    ],
  },
  my_projects: [
    {
      id: 4,
      title: 'Agri-Data',
      description: '',
      status: 'OPEN',
      needs: [],
      repo_url: '',
      demo_url: '',
      owner: { id: 1, full_name: 'Ada Lovelace', country: 'SN', is_demo: false },
      join_requests_count: 1,
      created_at: '',
      updated_at: '',
    },
  ],
  counters: { offered_skills: 5, wanted_skills: 3, matches: 12, exchanges: 1 },
}

const EMPTY = {
  profile_completeness: 100,
  has_contact: false,
  recommended_matches: [],
  pending_exchanges: { received: 0, sent: 0, items: [] },
  pending_join_requests: { count: 0, items: [] },
  my_projects: [],
  counters: { offered_skills: 0, wanted_skills: 0, matches: 0, exchanges: 0 },
}

/** Tout est fait : la liste des premiers pas n'a plus de raison d'être. */
const DONE = {
  ...EMPTY,
  has_contact: true,
  counters: { offered_skills: 2, wanted_skills: 1, matches: 4, exchanges: 1 },
}

function stub(payload: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(jsonResponse(String(url).includes('/dashboard/') ? payload : SESSION_USER)),
    ),
  )
}

describe('tableau de bord', () => {
  it('affiche les compteurs et les matchs recommandés', async () => {
    stub(FULL)
    renderWithRouter(<DashboardPage />, { authenticated: true })

    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(screen.getByText('Kofi Mensah')).toBeInTheDocument()
    expect(screen.getByText('83')).toBeInTheDocument()
  })

  it('invite à compléter un profil incomplet', async () => {
    stub(FULL)
    renderWithRouter(<DashboardPage />, { authenticated: true })

    expect(await screen.findByText(/complété à 80/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Compléter mon profil' })).toBeInTheDocument()
  })

  it('masque l invitation quand le profil est complet', async () => {
    stub(EMPTY)
    renderWithRouter(<DashboardPage />, { authenticated: true })

    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByText(/complété à/)).not.toBeInTheDocument()
  })

  it('résume les échanges et les demandes en attente', async () => {
    stub(FULL)
    renderWithRouter(<DashboardPage />, { authenticated: true })

    expect(await screen.findByText(/1 reçue\(s\) · 0 envoyée\(s\)/)).toBeInTheDocument()
    expect(screen.getByText('Fatou Kone souhaite rejoindre un de vos projets')).toBeInTheDocument()
  })

  it('guide l utilisateur quand tout est vide', async () => {
    stub(EMPTY)
    renderWithRouter(<DashboardPage />, { authenticated: true })

    expect(await screen.findByText(/Aucun match pour l'instant/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ajouter mes compétences' })).toBeInTheDocument()
  })

  it('affiche une erreur avec réessai', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderWithRouter(<DashboardPage />, { authenticated: true })

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('montre les premiers pas et une seule action : la prochaine', async () => {
    stub(EMPTY)
    renderWithRouter(<DashboardPage />, { authenticated: true })

    expect(await screen.findByRole('heading', { name: 'Vos premiers pas' })).toBeInTheDocument()
    expect(screen.getByText('1 étape faite sur 5')).toBeInTheDocument()
    // Profil complet : la prochaine étape est de déclarer une compétence.
    expect(screen.getByRole('link', { name: 'Ajouter une compétence' })).toHaveAttribute(
      'href',
      '/competences',
    )
    expect(screen.queryByRole('link', { name: 'Ajouter mon contact' })).not.toBeInTheDocument()
  })

  it('compte les étapes déjà faites', async () => {
    stub(FULL)
    renderWithRouter(<DashboardPage />, { authenticated: true })

    // Compétences et premier échange faits ; profil à 80 % et contact manquants.
    expect(await screen.findByText('3 étapes faites sur 5')).toBeInTheDocument()
  })

  it('disparaît une fois toutes les étapes faites', async () => {
    stub(DONE)
    renderWithRouter(<DashboardPage />, { authenticated: true })

    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('heading', { name: 'Vos premiers pas' })).not.toBeInTheDocument()
  })

  it('parle anglais quand l interface est en anglais', async () => {
    stub(FULL)
    renderWithRouter(<DashboardPage />, { authenticated: true, lang: 'en' })

    expect(await screen.findByRole('heading', { name: 'Hello Ada' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Your first steps' })).toBeInTheDocument()
    expect(screen.getByText('3 of 5 steps done')).toBeInTheDocument()
    expect(screen.getByText(/Your profile is 80% complete/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Complete my profile' })).toBeInTheDocument()
    expect(screen.getByText('matches')).toBeInTheDocument()
    expect(screen.getByText('1 received · 0 sent')).toBeInTheDocument()
    expect(screen.getByText('Mentoring with Kofi Mensah')).toBeInTheDocument()
    expect(screen.getByText('Fatou Kone wants to join one of your projects')).toBeInTheDocument()
    expect(screen.getByText('1 request')).toBeInTheDocument()
    expect(screen.queryByText(/Bonjour/)).not.toBeInTheDocument()
  })
})
