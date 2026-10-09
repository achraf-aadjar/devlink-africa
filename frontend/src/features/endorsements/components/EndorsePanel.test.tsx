import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { EndorsementCandidate } from '../../../lib/types'
import { jsonResponse } from '../../../test/helpers'
import EndorsePanel from './EndorsePanel'

const KOFI: EndorsementCandidate = {
  user: { id: 2, full_name: 'Kofi Mensah', country: 'GH' },
  context: 'EXCHANGE',
  skills: [
    { user_skill: 11, name: 'Python', level: 'ADVANCED', endorsement: null },
    { user_skill: 12, name: 'Docker', level: 'INTERMEDIATE', endorsement: 7 },
  ],
}

function setup(fetchResponse: Response = jsonResponse({ id: 8 }, 201)) {
  const fetchMock = vi.fn().mockResolvedValue(fetchResponse)
  vi.stubGlobal('fetch', fetchMock)
  const onChange = vi.fn()
  render(<EndorsePanel candidate={KOFI} onChange={onChange} />)
  return { fetchMock, onChange }
}

describe('panneau de validation', () => {
  it('présente ce que le partenaire a appris, validé ou non', () => {
    setup()

    expect(screen.getByText('Ce que Kofi vous a appris')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Valider Python' })).toBeInTheDocument()
    expect(screen.getByText('Validée')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retirer' })).toBeInTheDocument()
  })

  it('valide une compétence avec un commentaire facultatif', async () => {
    const { fetchMock, onChange } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Valider Python' }))
    await userEvent.type(
      screen.getByLabelText(/Un mot sur ce qu'il ou elle vous a appris/),
      'Très concret.',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer la validation' }))

    await waitFor(() => expect(onChange).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/endorsements/')
    expect(JSON.parse(init.body as string)).toEqual({ user_skill: 11, comment: 'Très concret.' })
  })

  it('retire une validation déjà donnée', async () => {
    const { fetchMock, onChange } = setup(new Response(null, { status: 204 }))

    await userEvent.click(screen.getByRole('button', { name: 'Retirer' }))

    await waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/endorsements/7/')
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
  })

  it('affiche le refus du serveur', async () => {
    setup(
      jsonResponse(
        { detail: 'Vous avez déjà validé cette compétence.', code: 'already_endorsed' },
        409,
      ),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Valider Python' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer la validation' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Vous avez déjà validé cette compétence.',
    )
  })
})
