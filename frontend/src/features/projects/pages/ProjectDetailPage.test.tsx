import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithRouter, SESSION_USER } from '../../../test/helpers'
import ProjectDetailPage from './ProjectDetailPage'

/** Projet d'un autre (id 2) : Ada (id 1) peut demander à le rejoindre. */
const OTHERS_PROJECT = {
  id: 4,
  title: 'Agri-Data',
  description: 'Collecte de données agricoles.',
  status: 'OPEN',
  needs: [{ id: 6, name: 'Python', category: 'BACKEND' }],
  repo_url: 'https://example.org/depot',
  demo_url: '',
  owner: { id: 2, full_name: 'Kofi Mensah', country: 'GH', is_demo: false },
  join_requests_count: 0,
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-20T10:00:00Z',
}

const MY_PROJECT = {
  ...OTHERS_PROJECT,
  owner: { id: 1, full_name: 'Ada Lovelace', country: 'SN', is_demo: false },
  join_requests: [
    {
      id: 7,
      project: 4,
      applicant: { id: 3, full_name: 'Fatou Kone' },
      message: 'Je peux aider sur Docker.',
      status: 'PENDING',
      created_at: '',
    },
  ],
}

function stub(project: unknown = OTHERS_PROJECT) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = String(url)
    if (init?.method === 'POST') return Promise.resolve(jsonResponse({ id: 7 }, 201))
    if (init?.method === 'PATCH')
      return Promise.resolve(jsonResponse({ id: 7, status: 'ACCEPTED' }))
    if (path.includes('/projects/4/')) return Promise.resolve(jsonResponse(project))
    return Promise.resolve(jsonResponse(SESSION_USER))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderPage() {
  return renderWithRouter(
    <Routes>
      <Route path="/projets/:id" element={<ProjectDetailPage />} />
    </Routes>,
    { route: '/projets/4', authenticated: true },
  )
}

describe('détail d un projet', () => {
  it('affiche le projet et ses besoins', async () => {
    stub()
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Agri-Data' })).toBeInTheDocument()
    expect(screen.getByText('Collecte de données agricoles.')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
  })

  it('ouvre les liens externes avec rel noopener', async () => {
    stub()
    renderPage()

    const link = await screen.findByRole('link', { name: 'Dépôt du code' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('affiche les dates du projet', async () => {
    stub()
    renderPage()

    expect(await screen.findByText(/Créé/)).toBeInTheDocument()
    expect(screen.getByText(/Mis à jour/)).toBeInTheDocument()
  })

  it('permet de demander à rejoindre', async () => {
    const fetchMock = stub()
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Rejoindre le projet' }))
    await userEvent.type(screen.getByLabelText(/Votre message/), 'Je peux aider')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }))

    await waitFor(() => {
      const posted = fetchMock.mock.calls.find((call) => call[1]?.method === 'POST')
      expect(JSON.parse(posted?.[1]?.body as string)).toEqual({ message: 'Je peux aider' })
    })
  })

  it('montre les outils du propriétaire sur son projet', async () => {
    stub(MY_PROJECT)
    renderPage()

    expect(await screen.findByRole('link', { name: 'Modifier' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rejoindre le projet' })).not.toBeInTheDocument()
  })

  it('liste les demandes reçues et permet de les accepter', async () => {
    const fetchMock = stub(MY_PROJECT)
    renderPage()

    expect(await screen.findByText('Fatou Kone')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Accepter' }))

    await waitFor(() => {
      const patched = fetchMock.mock.calls.find((call) => call[1]?.method === 'PATCH')
      expect(JSON.parse(patched?.[1]?.body as string)).toEqual({ status: 'ACCEPTED' })
    })
  })

  it('explique un projet inexistant', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          String(url).includes('/projects/4/')
            ? jsonResponse({ detail: 'Introuvable.', code: 'not_found' }, 404)
            : jsonResponse(SESSION_USER),
        ),
      ),
    )
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent("Ce projet n'existe pas.")
  })
})
