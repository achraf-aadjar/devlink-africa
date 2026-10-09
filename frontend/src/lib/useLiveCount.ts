import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Un compteur affiché dans la barre de navigation (demandes, invitations…).
 *
 * Relu à chaque changement de page et quand `event` est émis sur `window`
 * (après une action qui le modifie) : pas de rafraîchissement périodique, qui
 * ferait des appels même quand personne ne regarde. En cas d'erreur réseau, on
 * garde la dernière valeur plutôt que d'afficher une erreur dans la barre.
 *
 * `fetchCount` doit être stable (défini hors du composant).
 */
export function useLiveCount(
  fetchCount: () => Promise<number>,
  event: string,
  enabled: boolean,
): number {
  const { pathname } = useLocation()
  const [count, setCount] = useState(0)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const bump = () => setVersion((value) => value + 1)
    window.addEventListener(event, bump)
    return () => window.removeEventListener(event, bump)
  }, [event])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    fetchCount()
      .then((value) => {
        if (!cancelled) setCount(value)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [enabled, fetchCount, pathname, version])

  return enabled ? count : 0
}
