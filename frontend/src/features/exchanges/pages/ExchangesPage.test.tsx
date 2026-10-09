import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, page, renderWithRouter, SESSION_USER } from '../../../test/helpers'
import ExchangesPage from './ExchangesPage'

/** Ada (id 1) est la destinataire : elle peut accepter ou refuser. */
const RECEIVED = {
  id: 9,
  type: 'MENTORAT',
  status: 'PROPOSED',
  message: "Peux-tu m'aider sur Python ?",
  skill: { id: 6, name: 'Python', category: 'BACKEND' },
  requester: { id: 2, full_name: 'Kofi Mensah', contact: null },
  partner: { id: 1, full_name: 'Ada Lovelace', contact: null },
  scheduled_at: null,
  created_at: '',
  updated_at: '',
}

function stub(items: unknown[] = [RECEIVED], candidates: unknown[] = []) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      return Promise.resolve(jsonResponse({ ...RECEIVED, status: 'ACCEPTED' }))
    }
    if (String(url).includes('/endorsements/candidates/')) {
      return Promise.resolve(jsonResponse({ results: candidates }))
    }
    if (String(url).includes('/exchanges/')) return Promise.resolve(jsonResponse(page(items)))
    return Promise.resolve(jsonResponse(SESSION_USER))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('page des échanges', () => {
  it('affiche les demandes reçues', async () => {
    stub()
    renderWithRouter(<ExchangesPage />, { authenticated: true })

    expect(await screen.findByText(/Mentorat avec/)).toBeInTheDocument()
    expect(screen.getByText("Peux-tu m'aider sur Python ?")).toBeInTheDocument()
    expect(screen.getByText('Proposé')).toBeInTheDocument()
  })

  it('propose accepter et refuser au destinataire', async () => {
    stub()
    renderWithRouter(<ExchangesPage />, { authenticated: true })

    expect(await screen.findByRole('button', { name: 'Accepter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refuser' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Annuler ma demande' })).not.toBeInTheDocument()
  })

  it('accepte une demande', async () => {
    const fetchMock = stub()
    renderWithRouter(<ExchangesPage />, { authenticated: true })

    await userEvent.click(await screen.findByRole('button', { name: 'Accepter' }))

    await waitFor(() => {
      const patched = fetchMock.mock.calls.find((call) => call[1]?.method === 'PATCH')
      expect(JSON.parse(patched?.[1]?.body as string)).toEqual({ status: 'ACCEPTED' })
    })
  })

  it("propose l'annulation à l'auteur de la demande", async () => {
    const sent = {
      ...RECEIVED,
      requester: { id: 1, full_name: 'Ada' },
      partner: { id: 2, full_name: 'Kofi' },
    }
    stub([sent])
    renderWithRouter(<ExchangesPage />, { authenticated: true })

    expect(await screen.findByRole('button', { name: 'Annuler ma demande' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Accepter' })).not.toBeInTheDocument()
  })

  it('permet de conclure un échange accepté', async () => {
    stub([{ ...RECEIVED, status: 'ACCEPTED' }])
    renderWithRouter(<ExchangesPage />, { authenticated: true })

    expect(await screen.findByRole('button', { name: 'Marquer comme terminé' })).toBeInTheDocument()
  })

  it('bascule entre reçues et envoyées', async () => {
    const fetchMock = stub([])
    renderWithRouter(<ExchangesPage />, { authenticated: true })
    await screen.findByText('Aucune demande reçue')

    await userEvent.click(screen.getByRole('tab', { name: 'Envoyées' }))

    expect(await screen.findByText('Aucune demande envoyée')).toBeInTheDocument()
    await waitFor(() =>
      expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('direction=sent'))).toBe(
        true,
      ),
    )
  })

  it('donne le contact de l’autre une fois la demande acceptée', async () => {
    stub([
      {
        ...RECEIVED,
        status: 'ACCEPTED',
        requester: { id: 2, full_name: 'Kofi Mensah', contact: 'kofi@example.org' },
        partner: { id: 1, full_name: 'Ada Lovelace', contact: 'https://github.com/ada' },
      },
    ])
    renderWithRouter(<ExchangesPage />, { authenticated: true })

    const link = await screen.findByRole('link', { name: 'kofi@example.org' })
    expect(link).toHaveAttribute('href', 'mailto:kofi@example.org')
    expect(screen.queryByText(/ajoutez-le dans Mon profil/)).not.toBeInTheDocument()
  })

  it('ouvre un lien https de contact dans un nouvel onglet', async () => {
    stub([
      {
        ...RECEIVED,
        status: 'COMPLETED',
        requester: { id: 2, full_name: 'Kofi Mensah', contact: 'https://github.com/kofi' },
        partner: { id: 1, full_name: 'Ada Lovelace', contact: 'ada@example.org' },
      },
    ])
    renderWithRouter(<ExchangesPage />, { authenticated: true })

    const link = await screen.findByRole('link', { name: 'https://github.com/kofi' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('invite à renseigner son contact quand les deux en manquent', async () => {
    stub([{ ...RECEIVED, status: 'ACCEPTED' }])
    renderWithRouter(<ExchangesPage />, { authenticated: true })

    expect(
      await screen.findByText(/Kofi Mensah n'a pas encore indiqué de moyen de contact/),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'ajoutez-le dans Mon profil' })).toHaveAttribute(
      'href',
      '/profil',
    )
  })

  it("ne fait jamais un lien d'une valeur qui n'est ni un e-mail ni un https", async () => {
    stub([
      {
        ...RECEIVED,
        status: 'ACCEPTED',
        requester: { id: 2, full_name: 'Kofi Mensah', contact: 'javascript:alert(1)' },
        partner: { id: 1, full_name: 'Ada Lovelace', contact: 'ada@example.org' },
      },
    ])
    renderWithRouter(<ExchangesPage />, { authenticated: true })

    await screen.findByText(/Échange accepté/)
    expect(screen.queryByRole('link', { name: 'javascript:alert(1)' })).not.toBeInTheDocument()
  })

  it('ne montre aucun contact tant que la demande est en attente', async () => {
    stub()
    renderWithRouter(<ExchangesPage />, { authenticated: true })

    await screen.findByRole('button', { name: 'Accepter' })
    expect(screen.queryByText(/Échange accepté/)).not.toBeInTheDocument()
  })
})
