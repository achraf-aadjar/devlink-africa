import { useLiveCount } from '../../../lib/useLiveCount'
import { listCircles } from '../api/circles'

/** Événement émis après une action sur un cercle, pour rafraîchir le compteur. */
export const CIRCLES_CHANGED = 'devlink:circles-changed'

const countAwaiting = () =>
  listCircles({ awaiting: true }).then((page) => (typeof page.count === 'number' ? page.count : 0))

/** Nombre de cercles qui attendent la réponse de l'utilisateur. */
export function usePendingCircles(enabled: boolean): number {
  return useLiveCount(countAwaiting, CIRCLES_CHANGED, enabled)
}
