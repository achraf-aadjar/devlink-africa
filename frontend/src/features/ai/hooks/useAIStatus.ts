import { useQuery } from '../../../lib/useQuery'
import { getAIStatus } from '../api/ai'

/**
 * Les fonctions d'IA sont-elles disponibles ?
 *
 * L'interface n'affiche un bouton d'IA que si la réponse est oui : inutile de
 * proposer une action qui échouera. En cas d'erreur de l'appel lui-même, on
 * considère l'IA indisponible, ce qui est le comportement le plus sûr.
 */
export function useAIStatus(): { enabled: boolean; loading: boolean } {
  const { data, loading } = useQuery(() => getAIStatus(), [])
  return { enabled: data?.enabled ?? false, loading }
}
