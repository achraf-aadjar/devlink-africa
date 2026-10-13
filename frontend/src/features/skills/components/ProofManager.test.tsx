import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse } from '../../../test/helpers'
import type { UserSkill } from '../../../lib/types'
import ProofManager from './ProofManager'

const ENTRY: UserSkill = {
  id: 11,
  skill: { id: 1, name: 'React', category: 'FRONTEND' },
  kind: 'OFFERED',
  level: 'ADVANCED',
  proofs_count: 1,
  proofs: [
    {
      id: 7,
      kind: 'GITHUB_REPO',
      title: 'API de collecte',
      url: 'https://example.org/depot',
      description: 'Auteur principal.',
      created_at: '2026-10-09T10:00:00Z',
    },
  ],
}

const NO_PROOFS: UserSkill = { ...ENTRY, proofs_count: 0, proofs: [] }

describe('gestion des preuves', () => {
  it('replié, affiche seulement un compte', () => {
    render(<ProofManager entry={ENTRY} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: '1 preuve' })).toBeInTheDocument()
    expect(screen.queryByText('API de collecte')).not.toBeInTheDocument()
  })

  it('déplié, montre le titre et le lien de chaque preuve', async () => {
    render(<ProofManager entry={ENTRY} onChange={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: '1 preuve' }))

    const link = screen.getByRole('link', { name: 'API de collecte' })
    expect(link).toHaveAttribute('href', 'https://example.org/depot')
    expect(screen.getByText('Auteur principal.')).toBeInTheDocument()
  })

  it('sans preuve, propose directement d’en ajouter une', () => {
    render(<ProofManager entry={NO_PROOFS} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Ajouter une preuve' })).toBeInTheDocument()
  })

  it('ajoute une preuve et prévient le parent', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      void url
      void init
      return Promise.resolve(jsonResponse({ id: 8 }, 201))
    })
    vi.stubGlobal('fetch', fetchMock)
    const onChange = vi.fn()
    render(<ProofManager entry={NO_PROOFS} onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Ajouter une preuve' }))
    await userEvent.type(screen.getByLabelText('Titre'), 'Projet de démonstration')
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(onChange).toHaveBeenCalled()
    const call = fetchMock.mock.calls[0]
    expect(call[0]).toBe('/api/v1/me/skills/11/proofs/')
    expect(JSON.parse(call[1]?.body as string)).toMatchObject({ title: 'Projet de démonstration' })
  })

  it('refuse une preuve sans titre', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<ProofManager entry={NO_PROOFS} onChange={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Ajouter une preuve' }))
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(await screen.findByText('Donnez un titre à cette preuve.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('annuler sans preuve ramène au seul bouton de départ', async () => {
    render(<ProofManager entry={NO_PROOFS} onChange={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Ajouter une preuve' }))
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(screen.getAllByRole('button', { name: 'Ajouter une preuve' })).toHaveLength(1)
  })

  it('retire une preuve', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      void url
      void init
      return Promise.resolve(new Response(null, { status: 204 }))
    })
    vi.stubGlobal('fetch', fetchMock)
    const onChange = vi.fn()
    render(<ProofManager entry={ENTRY} onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: '1 preuve' }))
    await userEvent.click(screen.getByRole('button', { name: 'Retirer' }))

    expect(onChange).toHaveBeenCalled()
    const call = fetchMock.mock.calls[0]
    expect(call[0]).toBe('/api/v1/me/skills/11/proofs/7/')
    expect(call[1]?.method).toBe('DELETE')
  })
})
