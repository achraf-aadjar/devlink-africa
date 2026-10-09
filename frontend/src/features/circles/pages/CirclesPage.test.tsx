import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Circle } from '../../../lib/types'
import { jsonResponse, page, renderWithRouter, SESSION_USER } from '../../../test/helpers'
import CirclesPage from './CirclesPage'

/** Ada (id 1, la session) → Kwame (2) → Imani (3) → Ada. */
const ARROWS = [
  { teacher: 1, learner: 2, skill: { name: 'React', level: 'ADVANCED' } },
  { teacher: 2, learner: 3, skill: { name: 'FastAPI', level: 'ADVANCED' } },
  { teacher: 3, learner: 1, skill: { name: 'Docker', level: 'ADVANCED' } },
] as const

function member(id: number, name: string, extra: Partial<Circle['members'][number]> = {}) {
  return {
    id,
    full_name: name,
    country: 'SN',
    is_demo: false,
    response: null,
    contact: null,
    ...extra,
  }
}

const SUGGESTION: Circle = {
  id: null,
  key: '1-2-3',
  status: 'SUGGESTED',
  score: 100,
  members: [member(1, 'Ada Lovelace'), member(2, 'Kwame Boateng'), member(3, 'Imani Wanjiru')],
  arrows: [...ARROWS],
  created_at: null,
  activated_at: null,
}

function persisted(
  status: Circle['status'],
  responses: string[],
  contacts: (string | null)[] = [],
) {
  return {
    ...SUGGESTION,
    id: 7,
    status,
    created_at: '2026-10-09T10:00:00Z',
    members: SUGGESTION.members.map((m, i) => ({
      ...m,
      response: responses[i],
      contact: contacts[i] ?? null,
    })),
  } as Circle
}

function stub({
  suggestions = [] as Circle[],
  mine = [] as Circle[],
  candidates = [] as unknown[],
} = {}) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = String(url)
    if (init?.method === 'POST' || init?.method === 'PATCH') {
      return Promise.resolve(
        jsonResponse(persisted('PROPOSED', ['ACCEPTED', 'PENDING', 'PENDING']), 201),
      )
    }
    if (path.includes('/endorsements/candidates/')) {
      return Promise.resolve(jsonResponse({ results: candidates }))
    }
    if (path.includes('/circles/suggestions/'))
      return Promise.resolve(jsonResponse({ results: suggestions }))
    if (path.includes('/circles/')) return Promise.resolve(jsonResponse(page(mine)))
    return Promise.resolve(jsonResponse(SESSION_USER))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe("page des cercles d'échange", () => {
  it('présente un cercle possible à la deuxième personne', async () => {
    stub({ suggestions: [SUGGESTION] })
    renderWithRouter(<CirclesPage />, { authenticated: true })

    expect(await screen.findByText('Vous apprenez React à Kwame Boateng.')).toBeInTheDocument()
    expect(screen.getByText('Kwame Boateng apprend FastAPI à Imani Wanjiru.')).toBeInTheDocument()
    expect(screen.getByText('Imani Wanjiru vous apprend Docker.')).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: "Cercle d'échange. Vous apprenez React à Kwame Boateng. Kwame Boateng apprend FastAPI à Imani Wanjiru. Imani Wanjiru vous apprend Docker.",
      }),
    ).toBeInTheDocument()
  })

  it('propose le cercle avec ses membres dans l’ordre', async () => {
    const fetchMock = stub({ suggestions: [SUGGESTION] })
    renderWithRouter(<CirclesPage />, { authenticated: true })

    await userEvent.click(await screen.findByRole('button', { name: 'Proposer ce cercle' }))

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
      expect(JSON.parse(post?.[1]?.body as string)).toEqual({ members: [1, 2, 3] })
    })
  })

  it('place les invitations en tête et permet d’y répondre', async () => {
    const invitation = persisted('PROPOSED', ['PENDING', 'ACCEPTED', 'PENDING'])
    const fetchMock = stub({ mine: [invitation] })
    renderWithRouter(<CirclesPage />, { authenticated: true })

    expect(
      await screen.findByRole('heading', { name: 'Ils vous invitent dans leur cercle' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/1 sur 3 ont accepté/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Accepter' }))

    await waitFor(() => {
      const patch = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH')
      expect(patch?.[0]).toBe('/api/v1/circles/7/')
      expect(JSON.parse(patch?.[1]?.body as string)).toEqual({ decision: 'ACCEPT' })
    })
  })

  it('montre les contacts de tout le cercle une fois actif', async () => {
    stub({
      mine: [
        persisted(
          'ACTIVE',
          ['ACCEPTED', 'ACCEPTED', 'ACCEPTED'],
          ['ada@example.org', 'https://github.com/kwame', 'imani@example.org'],
        ),
      ],
    })
    renderWithRouter(<CirclesPage />, { authenticated: true })

    expect(await screen.findByText(/Tout le monde a accepté/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://github.com/kwame' })).toHaveAttribute(
      'target',
      '_blank',
    )
    expect(screen.getByRole('link', { name: 'imani@example.org' })).toHaveAttribute(
      'href',
      'mailto:imani@example.org',
    )
  })

  it('n’affiche aucun contact tant que tous n’ont pas accepté', async () => {
    stub({ mine: [persisted('PROPOSED', ['ACCEPTED', 'PENDING', 'PENDING'])] })
    renderWithRouter(<CirclesPage />, { authenticated: true })

    expect(await screen.findByText(/Vous avez accepté/)).toBeInTheDocument()
    expect(screen.queryByText(/Tout le monde a accepté/)).not.toBeInTheDocument()
  })

  it('guide vers les compétences quand aucun cercle n’est possible', async () => {
    stub()
    renderWithRouter(<CirclesPage />, { authenticated: true })

    expect(await screen.findByText("Aucun cercle pour l'instant")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ajouter mes compétences' })).toHaveAttribute(
      'href',
      '/competences',
    )
  })

  it('affiche le message du serveur quand une action échoue', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return Promise.resolve(
            jsonResponse({ detail: 'Ce cercle est déjà proposé.', code: 'duplicate_circle' }, 409),
          )
        }
        if (String(url).includes('/circles/suggestions/')) {
          return Promise.resolve(jsonResponse({ results: [SUGGESTION] }))
        }
        if (String(url).includes('/circles/')) return Promise.resolve(jsonResponse(page([])))
        return Promise.resolve(jsonResponse(SESSION_USER))
      }),
    )
    renderWithRouter(<CirclesPage />, { authenticated: true })

    await userEvent.click(await screen.findByRole('button', { name: 'Proposer ce cercle' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Ce cercle est déjà proposé.')
  })
})
