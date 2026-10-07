import { useState } from 'react'
import { Badge, Button, Card, Field } from '../../../components/ui'
import { ApiError } from '../../../lib/api'
import { naturalSearch } from '../api/ai'
import { useAIStatus } from '../hooks/useAIStatus'
import AIUnavailableNotice from './AIUnavailableNotice'

const CRITERION_LABELS: Record<string, string> = {
  q: 'Texte',
  skill: 'Sait faire',
  skill_wanted: 'Veut apprendre',
  country: 'Pays',
  level: 'Niveau',
  availability: 'Disponibilité',
  domain: 'Domaine',
}

/**
 * Recherche en langage naturel (DL-42, DL-45).
 *
 * Les critères devinés sont **affichés et appliqués aux filtres habituels** :
 * l'utilisateur les voit, les corrige, et la recherche classique fait le reste.
 */
export default function NaturalSearchBar({
  onCriteria,
}: {
  onCriteria: (criteria: Record<string, string>) => void
}) {
  const { enabled, loading: checking } = useAIStatus()
  const [query, setQuery] = useState('')
  const [working, setWorking] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [applied, setApplied] = useState<Record<string, string> | null>(null)

  if (checking || !enabled) return null

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!query.trim()) return

    setWorking(true)
    setUnavailable(false)
    try {
      const result = await naturalSearch(query.trim())
      setApplied(result.criteria)
      onCriteria(result.criteria)
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 503) setUnavailable(true)
    } finally {
      setWorking(false)
    }
  }

  const entries = Object.entries(applied ?? {})

  return (
    <Card className="flex flex-col gap-3 border-accent-200 bg-accent-50">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Field
            label="Décrivez qui vous cherchez"
            value={query}
            maxLength={500}
            placeholder="un dev React au Sénégal qui veut apprendre Docker"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Button type="submit" size="md" loading={working} disabled={!query.trim()}>
          Traduire en filtres
        </Button>
      </form>

      {unavailable && (
        <AIUnavailableNotice fallback="Utilisez les filtres ci-dessous, ils font le même travail." />
      )}

      {applied !== null && (
        <div role="status">
          {entries.length > 0 ? (
            <>
              <p className="mb-2 text-sm text-ink-700">
                Filtres appliqués, que vous pouvez corriger ci-dessous :
              </p>
              <ul className="flex flex-wrap gap-2">
                {entries.map(([key, value]) => (
                  <li key={key}>
                    <Badge tone="accent">
                      {CRITERION_LABELS[key] ?? key} : {value}
                    </Badge>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink-700">
              Nous n'avons pas su traduire cette phrase. Utilisez les filtres ci-dessous.
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
