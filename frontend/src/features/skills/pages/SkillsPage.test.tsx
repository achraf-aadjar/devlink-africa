import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, page, renderWithRouter, SESSION_USER } from '../../../test/helpers'
import SkillsPage from './SkillsPage'

const CATALOG = page([
  { id: 1, name: 'React', category: 'FRONTEND' },
  { id: 6, name: 'Python', category: 'BACKEND' },
  { id: 9, name: 'Docker', category: 'DEVOPS' },
])

const MINE = {
  offered: [
    {
      id: 11,
      skill: { id: 1, name: 'React', category: 'FRONTEND' },
      kind: 'OFFERED',
      level: 'ADVANCED',
      proofs_count: 2,
    },
  ],
  wanted: [
    {
      id: 12,
      skill: { id: 6, name: 'Python', category: 'BACKEND' },
      kind: 'WANTED',
      level: 'BEGINNER',
      proofs_count: 0,
    },
  ],
}

function stub(overrides: Record<string, unknown> = {}) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    void init
    const path = String(url).split('?')[0]
    if (path.endsWith('/me/skills/')) return Promise.resolve(jsonResponse(MINE))
    if (path.endsWith('/skills/')) return Promise.resolve(jsonResponse(CATALOG))
    if (path.endsWith('/me/')) return Promise.resolve(jsonResponse(SESSION_USER))
    const override = Object.entries(overrides).find(([key]) => path.includes(key))
    if (override) return Promise.resolve(override[1] as Response)
    return Promise.resolve(jsonResponse({}))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('page des compétences', () => {
  it('sépare les deux listes', async () => {
    stub()
    renderWithRouter(<SkillsPage />, { authenticated: true })

    expect(await screen.findByRole('heading', { name: 'Je sais faire' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Je veux apprendre' })).toBeInTheDocument()
    // Le sélecteur de niveau n'existe que pour une compétence déjà déclarée.
    expect(screen.getByLabelText('Niveau pour React')).toHaveValue('ADVANCED')
  })

  it('affiche le niveau et le nombre de preuves', async () => {
    stub()
    renderWithRouter(<SkillsPage />, { authenticated: true })

    // Le badge porte le niveau et le nombre de preuves, répartis en plusieurs
    // éléments : on cible donc son conteneur.
    const levelSelect = await screen.findByLabelText('Niveau pour React')
    const row = levelSelect.closest('li')
    expect(row).toHaveTextContent('Avancé')
    expect(row).toHaveTextContent('2 ✓')
  })

  it('ajoute une compétence et annonce le recalcul des matchs', async () => {
    const fetchMock = stub()
    renderWithRouter(<SkillsPage />, { authenticated: true })
    await screen.findByRole('heading', { name: 'Je sais faire' })

    const selects = screen.getAllByLabelText('Ajouter une compétence')
    await userEvent.selectOptions(selects[0], '9')
    await userEvent.click(screen.getAllByRole('button', { name: 'Ajouter' })[0])

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/recalculés/))
    const posted = fetchMock.mock.calls.find((call) => call[1]?.method === 'POST')
    expect(JSON.parse(posted?.[1]?.body as string)).toMatchObject({ skill: 9, kind: 'OFFERED' })
  })

  it('signale un doublon renvoyé par le serveur', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const path = String(url).split('?')[0]
      if (init?.method === 'POST') {
        return Promise.resolve(
          jsonResponse({ detail: 'Déjà déclarée.', code: 'duplicate_skill' }, 409),
        )
      }
      if (path.endsWith('/me/skills/')) return Promise.resolve(jsonResponse(MINE))
      if (path.endsWith('/skills/')) return Promise.resolve(jsonResponse(CATALOG))
      return Promise.resolve(jsonResponse(SESSION_USER))
    })
    vi.stubGlobal('fetch', fetchMock)
    renderWithRouter(<SkillsPage />, { authenticated: true })
    await screen.findByRole('heading', { name: 'Je sais faire' })

    await userEvent.selectOptions(screen.getAllByLabelText('Ajouter une compétence')[0], '9')
    await userEvent.click(screen.getAllByRole('button', { name: 'Ajouter' })[0])

    expect(await screen.findByRole('alert')).toHaveTextContent(/déjà déclaré/)
  })

  it('retire une compétence', async () => {
    const fetchMock = stub()
    renderWithRouter(<SkillsPage />, { authenticated: true })
    await screen.findByRole('heading', { name: 'Je sais faire' })

    await userEvent.click(screen.getAllByRole('button', { name: 'Retirer' })[0])

    await waitFor(() => {
      const deleted = fetchMock.mock.calls.find((call) => call[1]?.method === 'DELETE')
      expect(deleted?.[0]).toBe('/api/v1/me/skills/11/')
    })
  })
})
