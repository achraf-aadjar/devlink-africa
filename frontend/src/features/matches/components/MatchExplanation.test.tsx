import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { MatchExplanation as Explanation } from '../../../lib/types'
import MatchExplanation from './MatchExplanation'

const BREAKDOWN = [
  { criterion: 'complementarity', label: 'Complémentarité', weight: 35, points: 31.5 },
  { criterion: 'reciprocity', label: 'Réciprocité', weight: 20, points: 20 },
  { criterion: 'collaboration', label: 'Envie de collaborer', weight: 15, points: 11 },
  { criterion: 'common_tech', label: 'Technologies communes', weight: 10, points: 10 },
  { criterion: 'availability', label: 'Disponibilité', weight: 10, points: 5 },
  { criterion: 'domain', label: 'Domaine', weight: 10, points: 5 },
]

function makeExplanation(overrides: Partial<Explanation> = {}): Explanation {
  return {
    breakdown: BREAKDOWN,
    they_can_teach_you: [{ name: 'Python', level: 'ADVANCED' }],
    you_can_teach_them: [{ name: 'React', level: 'INTERMEDIATE' }],
    common_skills: [{ name: 'Docker' }],
    capped: false,
    reasons: ['Kofi peut vous apprendre Python.', 'Vous pouvez apprendre React à Kofi.'],
    ...overrides,
  }
}

describe("explication d'un match", () => {
  it('pose les deux personnes face à face sur le tableau', () => {
    render(<MatchExplanation explanation={makeExplanation()} partnerName="Kofi" myName="Aminata" />)

    const board = screen.getByRole('region', { name: 'Qui apprend quoi à qui' })
    expect(board).toHaveTextContent('Kofi')
    expect(board).toHaveTextContent('Aminata')
    expect(board).toHaveTextContent('vous')
  })

  it('montre ce que chacun peut apprendre à lautre', () => {
    render(<MatchExplanation explanation={makeExplanation()} partnerName="Kofi" myName="Aminata" />)

    expect(screen.getByRole('heading', { name: 'Kofi peut vous apprendre' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Vous pouvez lui apprendre' })).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
  })

  it('détaille les six critères avec leur poids', () => {
    render(<MatchExplanation explanation={makeExplanation()} partnerName="Kofi" myName="Aminata" />)

    const meters = screen.getAllByRole('meter')
    expect(meters).toHaveLength(6)
    expect(screen.getByText('Complémentarité')).toBeInTheDocument()
    const row = screen.getByRole('row', { name: /Complémentarité/ })
    expect(row).toHaveTextContent('31,5')
    expect(row).toHaveTextContent('35')
  })

  it('décrit chaque barre pour les lecteurs d écran', () => {
    render(<MatchExplanation explanation={makeExplanation()} partnerName="Kofi" myName="Aminata" />)

    expect(
      screen.getByRole('meter', { name: 'Réciprocité : 20,0 points sur 20' }),
    ).toBeInTheDocument()
  })

  it('affiche les raisons en phrases', () => {
    render(<MatchExplanation explanation={makeExplanation()} partnerName="Kofi" myName="Aminata" />)

    expect(screen.getByText('Kofi peut vous apprendre Python.')).toBeInTheDocument()
  })

  it('signale un score plafonné', () => {
    render(
      <MatchExplanation
        explanation={makeExplanation({ capped: true })}
        partnerName="Kofi"
        myName="Aminata"
      />,
    )

    expect(screen.getByText(/plafonné/)).toBeInTheDocument()
  })

  it('reste lisible quand il n y a rien à enseigner', () => {
    render(
      <MatchExplanation
        explanation={makeExplanation({ you_can_teach_them: [], they_can_teach_you: [] })}
        partnerName="Kofi"
        myName="Aminata"
      />,
    )

    expect(screen.getAllByText(/Rien pour le moment/)).toHaveLength(2)
  })

  it('affiche les technologies communes', () => {
    render(<MatchExplanation explanation={makeExplanation()} partnerName="Kofi" myName="Aminata" />)

    expect(screen.getByText(/Technologies que vous maîtrisez tous les deux/)).toBeInTheDocument()
    expect(screen.getByText('Docker')).toBeInTheDocument()
  })

  it('masque le bloc des technologies communes quand il n y en a pas', () => {
    render(
      <MatchExplanation
        explanation={makeExplanation({ common_skills: [] })}
        partnerName="Kofi"
        myName="Aminata"
      />,
    )

    expect(
      screen.queryByText(/Technologies que vous maîtrisez tous les deux/),
    ).not.toBeInTheDocument()
  })
})
