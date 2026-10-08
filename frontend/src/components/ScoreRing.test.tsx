import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ScoreRing from './ScoreRing'

describe('jauge de score', () => {
  it('arrondit le score et le décrit pour les lecteurs d’écran', () => {
    render(<ScoreRing score={82.5} />)
    expect(screen.getByRole('img', { name: 'Score de 83 sur 100' })).toBeInTheDocument()
    expect(screen.getByText('83')).toBeInTheDocument()
  })

  it('borne le score entre 0 et 100', () => {
    render(<ScoreRing score={140} />)
    expect(screen.getByRole('img', { name: 'Score de 100 sur 100' })).toBeInTheDocument()
  })
})
