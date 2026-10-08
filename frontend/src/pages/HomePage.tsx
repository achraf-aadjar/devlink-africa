import { Link } from 'react-router-dom'
import Icon, { type IconName } from '../components/icons/Icon'
import PageContainer from '../components/PageContainer'
import { Button, Card } from '../components/ui'
import { useAuth } from '../features/auth/hooks/useAuth'
import { cn } from '../lib/cn'

const STEPS: Array<{ title: string; text: string; icon: IconName }> = [
  {
    icon: 'profile',
    title: 'Votre profil',
    text: 'Pays, bio, disponibilités : dites qui vous êtes en deux minutes.',
  },
  {
    icon: 'skill',
    title: 'Vos compétences',
    text: 'Ce que vous savez faire, et ce que vous voulez apprendre.',
  },
  {
    icon: 'match',
    title: 'Dev Match',
    text: "Des profils complémentaires, avec le détail du score et l'explication.",
  },
  {
    icon: 'exchange',
    title: 'Un échange',
    text: 'Mentorat, revue de code, pair programming, projet commun.',
  },
]

/** Les quatre formes d'échange, reprises sous la bannière comme repère rapide. */
const EXCHANGE_KINDS: Array<{ icon: IconName; label: string }> = [
  { icon: 'mentoring', label: 'Mentorat' },
  { icon: 'debugging', label: 'Revue de code' },
  { icon: 'exchange', label: 'Pair programming' },
  { icon: 'project', label: 'Projet commun' },
]

/**
 * Pastille décorative flottante : purement visuelle (aria-hidden), masquée sur
 * petit écran pour ne jamais gêner la lecture ni déborder.
 */
function FloatingChip({
  icon,
  label,
  className,
}: {
  icon: IconName
  label: string
  className: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute hidden items-center gap-2 rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm font-medium text-ink-700 shadow-card xl:flex',
        className,
      )}
    >
      <Icon name={icon} size={18} className="text-accent-600" />
      {label}
    </div>
  )
}

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex flex-col">
      {/*
        Bannière sombre, sans photo (voir docs/DECISIONS.md : la photo utilisée
        dans les essais précédents allait du crème au sombre/marron, ce qui
        jurait avec un thème entièrement sombre bleu-gris). Fond de page uni :
        c'est aussi ce que fait l'écran d'accueil connecté de GitHub, le modèle
        demandé — pas de grand visuel, le contenu et la mise en page font le
        travail.
      */}
      <section className="relative isolate overflow-hidden border-b border-ink-200 bg-ink-50">
        <FloatingChip
          icon="mentoring"
          label="Mentorat"
          className="left-6 top-16 -rotate-6 lg:left-16"
        />
        <FloatingChip
          icon="debugging"
          label="Revue de code"
          className="right-6 top-28 rotate-3 lg:right-20"
        />
        <FloatingChip
          icon="project"
          label="Projet commun"
          className="bottom-16 left-10 rotate-3 lg:left-24"
        />
        <FloatingChip
          icon="match"
          label="Dev Match"
          className="bottom-24 right-8 -rotate-3 lg:right-16"
        />

        <PageContainer className="relative flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-700">
            Concours CADEV 2026
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-ink-900 sm:text-5xl lg:text-6xl">
            Apprenez ce qui vous manque,{' '}
            <span className="text-accent-600">enseignez ce que vous savez</span>.
          </h1>
          <p className="max-w-2xl text-lg text-ink-700">
            DevLink Africa met en relation les développeuses et développeurs d'Afrique selon leurs
            compétences complémentaires. Chaque proposition est accompagnée de son explication :
            vous savez toujours pourquoi un profil vous est proposé.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link to="/matchs">
                <Button size="lg">Voir mes matchs</Button>
              </Link>
            ) : (
              <>
                <Link to="/inscription">
                  <Button size="lg">Créer mon compte</Button>
                </Link>
                <Link to="/recherche">
                  <Button size="lg" variant="secondary">
                    Explorer les profils
                  </Button>
                </Link>
              </>
            )}
          </div>

          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {EXCHANGE_KINDS.map((kind) => (
              <li key={kind.label} className="flex items-center gap-2 text-sm text-ink-600">
                <Icon name={kind.icon} size={16} className="text-accent-600" />
                {kind.label}
              </li>
            ))}
          </ul>
        </PageContainer>
      </section>

      <PageContainer className="py-6">
        <section aria-labelledby="comment" className="flex flex-col gap-6">
          <h2 id="comment" className="text-2xl font-bold text-ink-900">
            Comment ça marche
          </h2>
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <Card key={step.title} as="li" className="flex flex-col gap-3">
                <span className="flex w-fit items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-sm font-semibold text-accent-700">
                  <Icon name={step.icon} size={16} />
                  Étape {index + 1}
                </span>
                <h3 className="text-lg font-semibold text-ink-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-ink-600">{step.text}</p>
              </Card>
            ))}
          </ol>
        </section>
      </PageContainer>
    </div>
  )
}
