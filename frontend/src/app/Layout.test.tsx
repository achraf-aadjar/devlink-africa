import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { setTokens } from '../lib/token'
import { routeFetch } from '../test/helpers'
import AuthProvider from './AuthProvider'
import Layout from './Layout'

const SESSION_USER = { id: 1, email: 'ada@example.org', full_name: 'Ada Lovelace', date_joined: '' }

// L'IA est coupée dans ces tests : ils portent sur la navigation, pas sur
// DevLink Copilot (testé séparément).
const AI_OFF = { '/ai/status': { enabled: false, features: [] } }

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
    vi.stubGlobal('fetch', routeFetch(AI_OFF))
    renderLayout()

    expect(await screen.findByRole('heading', { name: 'Accueil' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Connexion' })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Créer un compte' })[0]).toBeInTheDocument()
    // Les écrans privés ne sont pas proposés à un visiteur.
    expect(screen.queryByRole('link', { name: 'Tableau de bord' })).not.toBeInTheDocument()
  })

  it('affiche la navigation privée et le nom quand la session est ouverte', async () => {
    setTokens({ access: 'a', refresh: 'r' })
    vi.stubGlobal('fetch', routeFetch({ ...AI_OFF, '/me': SESSION_USER }))
    renderLayout()

    expect(await screen.findByRole('link', { name: 'Ada Lovelace' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tableau de bord' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Matchs' })).toBeInTheDocument()
  })

  it('déconnecte et efface les jetons', async () => {
    setTokens({ access: 'a', refresh: 'r' })
    const fetchMock = routeFetch({
      ...AI_OFF,
      '/me': SESSION_USER,
      '/auth/logout': new Response(null, { status: 204 }),
    })
    vi.stubGlobal('fetch', fetchMock)
    renderLayout()

    await userEvent.click(await screen.findByRole('button', { name: 'Se déconnecter' }))

    await waitFor(() => expect(localStorage.getItem('devlink.access_token')).toBeNull())
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('/auth/logout'))).toBe(true)
  })

  it('ouvre et ferme le menu mobile', async () => {
    vi.stubGlobal('fetch', routeFetch(AI_OFF))
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
    vi.stubGlobal('fetch', routeFetch(AI_OFF))
    renderLayout()

    const skip = await screen.findByRole('link', { name: 'Aller au contenu' })
    expect(skip).toHaveAttribute('href', '#contenu')
  })

  it('affiche le lien de confidentialité dans le pied de page', async () => {
    vi.stubGlobal('fetch', routeFetch(AI_OFF))
    renderLayout()

    expect(await screen.findByRole('link', { name: 'Confidentialité' })).toHaveAttribute(
      'href',
      '/confidentialite',
    )
  })
})
