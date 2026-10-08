import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { setTokens } from '../lib/token'
import AuthProvider from './AuthProvider'
import Layout from './Layout'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const SESSION_USER = { id: 1, email: 'ada@example.org', full_name: 'Ada Lovelace', date_joined: '' }

/** Répond selon l'adresse : session, compteur de demandes reçues, déconnexion. */
function sessionFetch(pendingCount = 0) {
  return vi.fn((url: string) => {
    const path = String(url)
    if (path.includes('/auth/logout/')) return Promise.resolve(new Response(null, { status: 204 }))
    if (path.includes('/exchanges/')) {
      return Promise.resolve(
        jsonResponse({ count: pendingCount, next: null, previous: null, results: [] }),
      )
    }
    return Promise.resolve(jsonResponse(SESSION_USER))
  })
}

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<h1>Accueil</h1>} />
            <Route path="connexion" element={<h1>Se connecter</h1>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('mise en page', () => {
  it('affiche les liens de connexion quand personne nest connecté', async () => {
    vi.stubGlobal('fetch', vi.fn())
    renderLayout()

    expect(await screen.findByRole('heading', { name: 'Accueil' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Se connecter' })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'S’inscrire' })[0]).toBeInTheDocument()
    // Les écrans privés ne sont pas proposés à un visiteur.
    expect(screen.queryByRole('link', { name: 'Tableau de bord' })).not.toBeInTheDocument()
  })

  it('affiche la navigation privée et le nom quand la session est ouverte', async () => {
    setTokens({ access: 'a', refresh: 'r' })
    vi.stubGlobal('fetch', sessionFetch())
    renderLayout()

    expect(await screen.findByRole('link', { name: 'Ada Lovelace' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tableau de bord' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Matchs' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Échanges' })).toBeInTheDocument()
  })

  it('signale les demandes reçues en attente à côté du lien Échanges', async () => {
    setTokens({ access: 'a', refresh: 'r' })
    const fetchMock = sessionFetch(2)
    vi.stubGlobal('fetch', fetchMock)
    renderLayout()

    expect(
      await screen.findByRole('link', { name: /^Échanges\s*\(2 demandes en attente\)$/ }),
    ).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes('/exchanges/?direction=received&status=PROPOSED'),
      ),
    ).toBe(true)
  })

  it('ne demande pas le compteur à un visiteur', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderLayout()

    await screen.findByRole('heading', { name: 'Accueil' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('déconnecte et efface les jetons', async () => {
    setTokens({ access: 'a', refresh: 'r' })
    const fetchMock = sessionFetch()
    vi.stubGlobal('fetch', fetchMock)
    renderLayout()

    await userEvent.click(await screen.findByRole('button', { name: 'Se déconnecter' }))

    await waitFor(() => expect(localStorage.getItem('devlink.access_token')).toBeNull())
    expect(fetchMock.mock.calls.map(([url]) => url)).toContain('/api/v1/auth/logout/')
  })

  it('ouvre et ferme le menu mobile', async () => {
    vi.stubGlobal('fetch', vi.fn())
    renderLayout()

    const toggle = await screen.findByRole('button', { name: 'Menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('navigation', { name: 'Navigation mobile' })).not.toBeInTheDocument()

    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Navigation mobile' })).toBeInTheDocument()

    await userEvent.click(toggle)

    expect(screen.queryByRole('navigation', { name: 'Navigation mobile' })).not.toBeInTheDocument()
  })

  it('propose un lien dévitement vers le contenu', async () => {
    vi.stubGlobal('fetch', vi.fn())
    renderLayout()

    const skip = await screen.findByRole('link', { name: 'Aller au contenu' })
    expect(skip).toHaveAttribute('href', '#contenu')
  })

  it('affiche le lien de confidentialité dans le pied de page', async () => {
    vi.stubGlobal('fetch', vi.fn())
    renderLayout()

    expect(await screen.findByRole('link', { name: 'Confidentialité' })).toHaveAttribute(
      'href',
      '/confidentialite',
    )
  })
})
