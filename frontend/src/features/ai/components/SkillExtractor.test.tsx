import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithRouter, SESSION_USER } from '../../../test/helpers'
import SkillExtractor from './SkillExtractor'

const SUGGESTIONS = {
  suggestions: {
    offered: [{ skill: 6, name: 'Python', level: 'ADVANCED' }],
    wanted: [{ skill: 4, name: 'Flutter' }],
  },
}

function stub({ enabled = true, extract = SUGGESTIONS as unknown, status = 200 } = {}) {
  const fetchMock = vi.fn((url: string) => {
    const path = String(url)
    if (path.includes('/ai/status/')) {
      return Promise.resolve(
        jsonResponse({ enabled, features: enabled ? ['skill_extraction'] : [] }),
      )
    }
    if (path.includes('/ai/extract-skills/')) {
      return Promise.resolve(jsonResponse(extract, status))
    }
    return Promise.resolve(jsonResponse(SESSION_USER))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const TEXT = 'Je fais du Django depuis trois ans et je veux apprendre Flutter.'

describe('extraction de compétences', () => {
  it("ne s'affiche pas quand l'IA est désactivée", async () => {
    stub({ enabled: false })
    renderWithRouter(<SkillExtractor onAccept={vi.fn()} />, { authenticated: true })

    // On attend que le statut soit connu, puis on vérifie l'absence du bloc.
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Remplir depuis un texte' }),
      ).not.toBeInTheDocument(),
    )
  })

  it("s'affiche quand l'IA est active", async () => {
    stub()
    renderWithRouter(<SkillExtractor onAccept={vi.fn()} />, { authenticated: true })

    expect(
      await screen.findByRole('heading', { name: 'Remplir depuis un texte' }),
    ).toBeInTheDocument()
  })

  it('propose les compétences trouvées', async () => {
    stub()
    renderWithRouter(<SkillExtractor onAccept={vi.fn()} />, { authenticated: true })
    await screen.findByRole('heading', { name: 'Remplir depuis un texte' })

    await userEvent.type(screen.getByLabelText('Votre parcours'), TEXT)
    await userEvent.click(screen.getByRole('button', { name: 'Proposer des compétences' }))

    expect(
      await screen.findByRole('button', { name: 'Ajouter Python à ce que je sais faire' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ajouter Flutter à ce que je veux apprendre' }),
    ).toBeInTheDocument()
  })

  it("n'ajoute rien sans un clic de l'utilisateur", async () => {
    const onAccept = vi.fn()
    stub()
    renderWithRouter(<SkillExtractor onAccept={onAccept} />, { authenticated: true })
    await screen.findByRole('heading', { name: 'Remplir depuis un texte' })

    await userEvent.type(screen.getByLabelText('Votre parcours'), TEXT)
    await userEvent.click(screen.getByRole('button', { name: 'Proposer des compétences' }))
    await screen.findByRole('button', { name: 'Ajouter Python à ce que je sais faire' })

    expect(onAccept).not.toHaveBeenCalled()
    expect(screen.getByText(/Rien n'est enregistré avant votre clic/)).toBeInTheDocument()
  })

  it('ajoute une compétence au clic, avec son niveau', async () => {
    const onAccept = vi.fn()
    stub()
    renderWithRouter(<SkillExtractor onAccept={onAccept} />, { authenticated: true })
    await screen.findByRole('heading', { name: 'Remplir depuis un texte' })

    await userEvent.type(screen.getByLabelText('Votre parcours'), TEXT)
    await userEvent.click(screen.getByRole('button', { name: 'Proposer des compétences' }))
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ajouter Python à ce que je sais faire' }),
    )

    expect(onAccept).toHaveBeenCalledWith('OFFERED', 6, 'ADVANCED')
  })

  it('explique calmement une indisponibilité', async () => {
    stub({ extract: { detail: 'Indisponible.', code: 'ai_unavailable' }, status: 503 })
    renderWithRouter(<SkillExtractor onAccept={vi.fn()} />, { authenticated: true })
    await screen.findByRole('heading', { name: 'Remplir depuis un texte' })

    await userEvent.type(screen.getByLabelText('Votre parcours'), TEXT)
    await userEvent.click(screen.getByRole('button', { name: 'Proposer des compétences' }))

    expect(await screen.findByText(/momentanément indisponible/)).toBeInTheDocument()
    expect(screen.getByText(/continuer à remplir le formulaire vous-même/)).toBeInTheDocument()
  })

  it('le dit quand aucune compétence n est reconnue', async () => {
    stub({ extract: { suggestions: { offered: [], wanted: [] } } })
    renderWithRouter(<SkillExtractor onAccept={vi.fn()} />, { authenticated: true })
    await screen.findByRole('heading', { name: 'Remplir depuis un texte' })

    await userEvent.type(screen.getByLabelText('Votre parcours'), TEXT)
    await userEvent.click(screen.getByRole('button', { name: 'Proposer des compétences' }))

    expect(await screen.findByText(/Aucune compétence reconnue/)).toBeInTheDocument()
  })

  it('désactive le bouton tant que le texte est trop court', async () => {
    stub()
    renderWithRouter(<SkillExtractor onAccept={vi.fn()} />, { authenticated: true })
    await screen.findByRole('heading', { name: 'Remplir depuis un texte' })

    expect(screen.getByRole('button', { name: 'Proposer des compétences' })).toBeDisabled()

    await userEvent.type(screen.getByLabelText('Votre parcours'), TEXT)

    expect(screen.getByRole('button', { name: 'Proposer des compétences' })).toBeEnabled()
  })
})
