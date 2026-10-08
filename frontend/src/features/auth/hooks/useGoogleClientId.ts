import { useQuery } from '../../../lib/useQuery'
import { getGoogleClientId } from '../api/auth'

/**
 * Identifiant client OAuth Google, ou chaîne vide si non configuré.
 *
 * Même logique que `useAIStatus` : l'interface ne propose « Continuer avec
 * Google » que si la réponse donne un identifiant, inutile d'afficher un
 * bouton qui échouera toujours.
 */
export function useGoogleClientId(): { clientId: string; loading: boolean } {
  const { data, loading } = useQuery(() => getGoogleClientId(), [])
  return { clientId: data?.client_id ?? '', loading }
}
