import { Link } from 'react-router-dom'
import Icon, { type IconName } from '../components/icons/Icon'
import { RingsPattern } from '../components/icons/Patterns'
import { Badge, Button, Card } from '../components/ui'
import { useAuth } from '../features/auth/hooks/useAuth'

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

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex flex-col gap-14">
      <RingsPattern className="flex flex-col items-start gap-5 rounded-card py-10">
        <Badge tone="accent">Concours CADEV 2026</Badge>
        <h1 className="max-w-3xl text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">
          Apprenez ce qui vous manque, enseignez ce que vous savez.
        </h1>
        <p className="max-w-2xl text-base text-ink-600">
          DevLink Africa met en relation les développeuses et développeurs d'Afrique selon leurs
          compétences complémentaires. Chaque proposition est accompagnée de son explication : vous
          savez toujours pourquoi un profil vous est proposé.
        </p>
        <div className="flex flex-wrap gap-3">
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
      </RingsPattern>

      <section aria-labelledby="comment" className="flex flex-col gap-5">
        <h2 id="comment" className="text-xl font-semibold text-ink-900">
          Comment ça marche
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Card key={step.title} as="li" className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-accent-700">
                <Icon name={step.icon} size={18} />
                Étape {index + 1}
              </span>
              <h3 className="font-semibold text-ink-900">{step.title}</h3>
              <p className="text-sm text-ink-600">{step.text}</p>
            </Card>
          ))}
        </ol>
      </section>
    </div>
  )
}
