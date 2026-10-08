import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { listExchanges } from '../api/exchanges'

/** Événement émis après une action sur un échange, pour rafraîchir le compteur. */
export const EXCHANGES_CHANGED = 'devlink:exchanges-changed'

/**
 * Nombre de demandes d'échange reçues et encore sans réponse.
 *
 * Relu à chaque changement de page et après chaque action sur un échange :
 * pas de rafraîchissement périodique, qui ferait des appels même quand
 * personne ne regarde. En cas d'erreur réseau, on garde la dernière valeur
 * plutôt que d'afficher une erreur dans la barre de navigation.
 */
export function usePendingRequests(enabled: boolean): number {
  const { pathname } = useLocation()
  const [count, setCount] = useState(0)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const bump = () => setVersion((value) => value + 1)
    window.addEventListener(EXCHANGES_CHANGED, bump)
    return () => window.removeEventListener(EXCHANGES_CHANGED, bump)
  }, [])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    listExchanges({ direction: 'received', status: 'PROPOSED' })
      .then((page) => {
        if (!cancelled) setCount(typeof page.count === 'number' ? page.count : 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [enabled, pathname, version])

  return enabled ? count : 0
}
