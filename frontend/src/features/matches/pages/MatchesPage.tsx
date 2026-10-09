import { Link } from 'react-router-dom'
import { Button, EmptyState, ErrorState, LoadingState } from '../../../components/ui'
import { useQuery } from '../../../lib/useQuery'
import { listMatches } from '../api/matches'
import MatchCard from '../components/MatchCard'

export default function MatchesPage() {
  const { data, loading, error, reload } = useQuery(() => listMatches(), [])

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">Mes matchs</h1>
        <p className="mt-1 text-sm text-ink-600">
          Dev Match vous propose des profils complémentaires : chacun sait ce que l'autre veut
          apprendre.
        </p>
      </header>

      <Link
        to="/cercles"
        className="surface group flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition hover:ring-accent-400/40"
      >
        <span className="text-sm text-ink-700">
          <strong className="font-semibold text-ink-900">Pas de paire parfaite ?</strong> Vos
          compétences peuvent aussi circuler dans un cercle de trois ou quatre personnes.
        </span>
        <span className="text-sm font-medium text-accent-800 group-hover:underline">
          Voir mes cercles d'échange →
        </span>
      </Link>

      {loading && <LoadingState rows={3} label="Chargement de vos matchs…" />}

      {error && <ErrorState onRetry={reload} />}

      {data && data.results.length === 0 && (
        <EmptyState
          title="Aucun match pour le moment"
          description="Déclarez ce que vous savez faire et ce que vous voulez apprendre : nous chercherons alors des développeurs complémentaires."
          action={
            <Link to="/competences">
              <Button>Ajouter mes compétences</Button>
            </Link>
          }
        />
      )}

      {data && data.results.length > 0 && (
        <>
          <p className="text-sm text-ink-600">
            {data.count} développeur{data.count > 1 ? 's' : ''} correspond
            {data.count > 1 ? 'ent' : ''} à votre profil.
          </p>
          <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.results.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
