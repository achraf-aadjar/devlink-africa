import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DotsPattern, RingsPattern, WeavePattern } from './Patterns'

const PATTERNS = [
  ['anneaux', RingsPattern],
  ['tissage', WeavePattern],
  ['points', DotsPattern],
] as const

describe('motifs d arrière-plan', () => {
  it.each(PATTERNS)('%s : affiche le contenu posé dessus', (_, Pattern) => {
    render(
      <Pattern>
        <p>Du texte lisible</p>
      </Pattern>,
    )

    expect(screen.getByText('Du texte lisible')).toBeInTheDocument()
  })

  it.each(PATTERNS)('%s : est masqué aux lecteurs d écran', (_, Pattern) => {
    const { container } = render(<Pattern />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it.each(PATTERNS)('%s : reste très discret', (_, Pattern) => {
    // Au-delà de 0,2 d'opacité, un motif commence à gêner la lecture. WeavePattern
    // est volontairement le plus marqué des trois (0,16) : il sert d'en-tête de
    // section, là où les deux autres habillent un fond de page.
    const { container } = render(<Pattern />)

    const rect = container.querySelector('rect[fill^="url"]')
    expect(Number(rect?.getAttribute('opacity'))).toBeLessThanOrEqual(0.2)
  })

  it.each(PATTERNS)('%s : ne capte jamais le clic', (_, Pattern) => {
    // Un fond décoratif ne doit pas intercepter les clics destinés au contenu.
    // `className` d'un élément SVG est un SVGAnimatedString, d'où getAttribute.
    const { container } = render(<Pattern />)

    expect(container.querySelector('svg')?.getAttribute('class')).toContain('pointer-events-none')
  })
})
