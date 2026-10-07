import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, page, renderWithRouter, SESSION_USER } from '../../../test/helpers'
import ProjectFormPage from './ProjectFormPage'

const CATALOG = page([{ id: 6, name: 'Python', category: 'BACKEND' }])

function stub(createResponse?: Response) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = String(url)
    if (init?.method === 'POST') {
      return Promise.resolve(createResponse ?? jsonResponse({ id: 4 }, 201))
    }
    if (path.includes('/skills/')) return Promise.resolve(jsonResponse(CATALOG))
    return Promise.resolve(jsonResponse(SESSION_USER))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderPage() {
  return renderWithRouter(
    <Routes>
      <Route path="/projets/nouveau" element={<ProjectFormPage />} />
      <Route path="/projets/:id" element={<h1>Projet publié</h1>} />
    </Routes>,
    { route: '/projets/nouveau', authenticated: true },
  )
}

describe('formulaire de projet', () => {
  it('affiche le formulaire de création', async () => {
    stub()
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Proposer un projet' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Titre/)).toBeInTheDocument()
  })

  it('exige un titre', async () => {
    const fetchMock = stub()
    renderPage()
    await screen.findByLabelText(/Titre/)

    await userEvent.click(screen.getByRole('button', { name: 'Publier le projet' }))

    expect(await screen.findByText('Donnez un titre à votre projet.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some((call) => call[1]?.method === 'POST')).toBe(false)
  })

  it('publie le projet puis redirige', async () => {
    const fetchMock = stub()
    renderPage()
    await screen.findByLabelText(/Titre/)

    await userEvent.type(screen.getByLabelText(/Titre/), 'Agri-Data')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Python' }))
    await userEvent.click(screen.getByRole('button', { name: 'Publier le projet' }))

    expect(await screen.findByRole('heading', { name: 'Projet publié' })).toBeInTheDocument()
    const posted = fetchMock.mock.calls.find((call) => call[1]?.method === 'POST')
    expect(JSON.parse(posted?.[1]?.body as string)).toMatchObject({
      title: 'Agri-Data',
      needs: [6],
    })
  })

  it('affiche une erreur de validation du serveur', async () => {
    stub(
      jsonResponse(
        {
          detail: 'Invalide.',
          code: 'invalid',
          errors: { repo_url: ["L'adresse doit commencer par https://."] },
        },
        400,
      ),
    )
    renderPage()
    await screen.findByLabelText(/Titre/)

    await userEvent.type(screen.getByLabelText(/Titre/), 'Agri-Data')
    await userEvent.click(screen.getByRole('button', { name: 'Publier le projet' }))

    await waitFor(() =>
      expect(screen.getByText("L'adresse doit commencer par https://.")).toBeInTheDocument(),
    )
  })
})
