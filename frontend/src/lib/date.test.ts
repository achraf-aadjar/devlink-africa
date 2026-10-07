import { describe, expect, it } from 'vitest'
import { formatRelativeDate, shortenUrl } from './date'

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString()
}

describe('formatRelativeDate', () => {
  it('renvoie une chaîne vide pour une date invalide', () => {
    expect(formatRelativeDate('')).toBe('')
    expect(formatRelativeDate('pas-une-date')).toBe('')
  })

  it("affiche aujourd'hui pour une date du jour", () => {
    expect(formatRelativeDate(daysAgo(0))).toBe("aujourd'hui")
  })

  it('affiche hier pour la veille', () => {
    expect(formatRelativeDate(daysAgo(1))).toBe('hier')
  })

  it('compte les jours en dessous dune semaine', () => {
    expect(formatRelativeDate(daysAgo(4))).toBe('il y a 4 jours')
  })

  it('compte les semaines en dessous dun mois', () => {
    expect(formatRelativeDate(daysAgo(14))).toBe('il y a 2 semaines')
  })

  it('retombe sur une date courte au-delà dun mois', () => {
    const result = formatRelativeDate(daysAgo(400))
    expect(result).not.toMatch(/il y a|aujourd|hier/)
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('shortenUrl', () => {
  it('garde hôte et chemin, sans le protocole', () => {
    expect(shortenUrl('https://github.com/devlink/agri-collecte')).toBe(
      'github.com/devlink/agri-collecte',
    )
  })

  it('retire la barre oblique finale', () => {
    expect(shortenUrl('https://gitlab.com/equipe/projet/')).toBe('gitlab.com/equipe/projet')
  })

  it('renvoie la valeur telle quelle si ce nest pas une URL', () => {
    expect(shortenUrl('pas-une-url')).toBe('pas-une-url')
  })
})
