import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Avatar from './Avatar'

describe('avatar', () => {
  it('affiche les initiales du prénom et du nom', () => {
    const { container } = render(<Avatar name="Aminata Diallo" />)
    expect(container.textContent).toBe('AD')
  })

  it('se contente d’une initiale pour un nom seul, et d’un point d’interrogation sans nom', () => {
    expect(render(<Avatar name="Kofi" />).container.textContent).toBe('K')
    expect(render(<Avatar name="  " />).container.textContent).toBe('?')
  })

  it('garde la même couleur pour un même nom', () => {
    const colour = (name: string) =>
      (render(<Avatar name={name} />).container.firstElementChild as HTMLElement).style.background
    expect(colour('Kofi Mensah')).toBe(colour('Kofi Mensah'))
    expect(colour('Kofi Mensah')).toContain('linear-gradient')
  })

  it('est décoratif : le nom est déjà écrit à côté', () => {
    const { container } = render(<Avatar name="Kofi Mensah" />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
