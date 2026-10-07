import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Logo, { LogoMark } from './Logo'

describe('marque', () => {
  it('porte le nom du produit pour les lecteurs d écran', () => {
    render(<LogoMark />)

    expect(screen.getByRole('img', { name: 'DevLink Africa' })).toBeInTheDocument()
  })

  it('utilise les couleurs de la marque par défaut', () => {
    const { container } = render(<LogoMark />)

    const circles = container.querySelectorAll('circle')
    expect(circles[0]).toHaveAttribute('stroke', '#b24422')
    expect(circles[1]).toHaveAttribute('stroke', '#2d2925')
  })

  it('passe en monochrome sur demande, pour un fond coloré', () => {
    const { container } = render(<LogoMark variant="mono" />)

    for (const circle of container.querySelectorAll('circle')) {
      expect(circle).toHaveAttribute('stroke', 'currentColor')
    }
  })

  it('garde une intersection légère, qui n écrase pas les anneaux', () => {
    const { container } = render(<LogoMark />)

    const lens = container.querySelector('path')
    expect(Number(lens?.getAttribute('fill-opacity'))).toBeLessThan(0.3)
  })

  it('la version horizontale affiche le nom en texte', () => {
    render(<Logo />)

    // Le nom est en texte, pas en image : il reste sélectionnable et traduisible.
    expect(screen.getByText(/DevLink/)).toBeInTheDocument()
    expect(screen.getByText('Africa')).toBeInTheDocument()
  })

  it('accepte une taille', () => {
    const { container } = render(<LogoMark size={64} />)

    expect(container.querySelector('svg')).toHaveAttribute('width', '64')
  })
})
