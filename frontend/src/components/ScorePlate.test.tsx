import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ScorePlate from './ScorePlate'

describe('plaque de score', () => {
  it('arrondit le score et le décrit pour les lecteurs d’écran', () => {
    render(<ScorePlate score={82.5} />)
    expect(screen.getByRole('img', { name: 'Score de 83 sur 100' })).toBeInTheDocument()
    expect(screen.getByText('83')).toBeInTheDocument()
  })

  it('borne le score entre 0 et 100', () => {
    render(<ScorePlate score={140} />)
    expect(screen.getByRole('img', { name: 'Score de 100 sur 100' })).toBeInTheDocument()
  })
})
