import { useEffect, useState } from 'react'

export interface QueryState<T> {
  data: T | null
  /** Vrai pendant le premier chargement, et à chaque rechargement. */
  loading: boolean
  error: Error | null
  reload: () => void
}

interface Result<T> {
  data: T | null
  error: Error | null
  /** Clé de la requête dont ce résultat provient. */
  from: string
}

/**
 * Charge une donnée et expose les quatre états attendus par le cahier des
 * charges : chargement, vide, erreur, succès.
 *
 * `key` identifie la requête : quand elle change, on recharge. On passe par une
 * clé plutôt que par une liste de dépendances, car la fonction de chargement est
 * recréée à chaque rendu et ne pourrait donc pas en être une.
 *
 * `loading` est **déduit** et non stocké : il est vrai tant que le résultat
 * présent ne correspond pas à la requête en cours. Cela évite d'appeler
 * setState dans le corps de l'effet, ce qui provoquerait des rendus en cascade.
 *
 * Volontairement simple : pas de bibliothèque de cache (voir docs/DECISIONS.md).
 */
export function useQuery<T>(fetcher: () => Promise<T>, key: unknown[] = []): QueryState<T> {
  const [tick, setTick] = useState(0)
  const [result, setResult] = useState<Result<T>>({ data: null, error: null, from: '' })

  const currentKey = `${tick}:${JSON.stringify(key)}`

  useEffect(() => {
    let cancelled = false

    fetcher()
      .then((data) => {
        if (!cancelled) setResult({ data, error: null, from: currentKey })
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setResult({
            data: null,
            error: cause instanceof Error ? cause : new Error('Erreur inconnue'),
            from: currentKey,
          })
        }
      })

    return () => {
      cancelled = true
    }
    // `fetcher` est recréé à chaque rendu : c'est la clé qui dit quand recharger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey])

  const loading = result.from !== currentKey

  return {
    data: loading ? null : result.data,
    loading,
    error: loading ? null : result.error,
    reload: () => setTick((value) => value + 1),
  }
}
