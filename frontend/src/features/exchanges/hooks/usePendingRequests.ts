import { useLiveCount } from '../../../lib/useLiveCount'
import { listExchanges } from '../api/exchanges'

/** Événement émis après une action sur un échange, pour rafraîchir le compteur. */
export const EXCHANGES_CHANGED = 'devlink:exchanges-changed'

const countPending = () =>
  listExchanges({ direction: 'received', status: 'PROPOSED' }).then((page) =>
    typeof page.count === 'number' ? page.count : 0,
  )

/** Nombre de demandes d'échange reçues et encore sans réponse. */
export function usePendingRequests(enabled: boolean): number {
  return useLiveCount(countPending, EXCHANGES_CHANGED, enabled)
}
