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
  requester: { id: 2, full_name: 'Kofi Mensah' },
  partner: { id: 1, full_name: 'Ada Lovelace' },
  scheduled_at: null,
  created_at: '',
  updated_at: '',
}

function stub(items: unknown[] = [RECEIVED]) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      return Promise.resolve(jsonResponse({ ...RECEIVED, status: 'ACCEPTED' }))
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
})
