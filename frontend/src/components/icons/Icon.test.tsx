import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Icon from './Icon'
import { ICON_NAMES, PATHS } from './paths'

describe('icônes', () => {
  it('rend chaque icône du jeu sans erreur', () => {
    for (const name of ICON_NAMES) {
      const { container, unmount } = render(<Icon name={name} />)
      expect(container.querySelector('path')).toHaveAttribute('d')
      unmount()
    }
  })

  it('est masquée aux lecteurs d écran quand elle est décorative', () => {
    const { container } = render(<Icon name="match" />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).not.toHaveAttribute('role')
  })

  it('devient une image nommée quand elle porte du sens', () => {
    render(<Icon name="warning" label="Attention" />)

    const icon = screen.getByRole('img', { name: 'Attention' })
    expect(icon).not.toHaveAttribute('aria-hidden')
  })

  it('suit la couleur du texte environnant', () => {
    const { container } = render(<Icon name="check" />)

    expect(container.querySelector('svg')).toHaveAttribute('stroke', 'currentColor')
  })

  it('accepte une taille', () => {
    const { container } = render(<Icon name="profile" size={32} />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
  })

  it('n est jamais focusable au clavier', () => {
    const { container } = render(<Icon name="close" />)

    expect(container.querySelector('svg')).toHaveAttribute('focusable', 'false')
  })
})

describe('cohérence du jeu', () => {
  it('contient les icônes dont l interface a besoin', () => {
    const required = [
      'dashboard',
      'profile',
      'skill',
      'match',
      'exchange',
      'project',
      'search',
      'country',
      'menu',
      'close',
      'check',
      'warning',
      'mentoring',
      'codeReview',
      'pairProgramming',
      'debugging',
    ]

    for (const name of required) {
      expect(ICON_NAMES).toContain(name)
    }
  })

  it('dessine chaque icône dans la grille de 24 unités', () => {
    // Un tracé qui sort de la grille produit une icône rognée. On ne contrôle
    // que les commandes en majuscule (coordonnées absolues) : les minuscules
    // sont des déplacements relatifs, dont les valeurs négatives sont normales.
    for (const [name, path] of Object.entries(PATHS)) {
      const absolute = path.match(/[MLHVC]\s*[-\d.\s,]+/g) ?? []
      for (const segment of absolute) {
        for (const raw of segment.match(/-?\d+(\.\d+)?/g) ?? []) {
          const value = Number(raw)
          expect(value, `${name} : coordonnée absolue ${value} hors grille`).toBeGreaterThanOrEqual(
            -0.5,
          )
          expect(value, `${name} : coordonnée absolue ${value} hors grille`).toBeLessThanOrEqual(
            24.5,
          )
        }
      }
    }
  })

  it('n utilise aucun remplissage dans les tracés', () => {
    // Le jeu est au trait : un remplissage casserait l'homogénéité visuelle.
    for (const path of Object.values(PATHS)) {
      expect(path).not.toContain('fill')
    }
  })
})
