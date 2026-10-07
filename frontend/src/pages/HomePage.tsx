import { Link } from 'react-router-dom'
import heroBackground from '../assets/images/hero-background.jpg'
import Icon, { type IconName } from '../components/icons/Icon'
import PageContainer from '../components/PageContainer'
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
    <div className="flex flex-col">
      {/*
        Bannière pleine largeur, sur la photo de fond (voir docs/DECISIONS.md
        pour son origine : générée par IA, pas une photo tierce).
        `bg-accent-100` sert de couleur de repli tant que l'image charge, ou si
        elle échoue : elle reste proche de la teinte dominante de la photo, donc
        aucun flash disgracieux.

        L'image passe du clair (haut) au très sombre (bas) : mesuré, le
        contraste de notre texte sombre tombe sous la norme AA (4,5:1) dès 50 %
        de hauteur, et du texte blanc serait illisible dans le tiers supérieur.
        Aucune couleur de texte unique ne fonctionne sur toute l'image.
        D'où le panneau clair et flouté qui porte le texte : son fond quasi
        opaque garantit le contraste quel que soit le pixel de la photo
        derrière lui, à n'importe quelle taille d'écran et quelle que soit la
        longueur du texte (donc robuste au responsive, contrairement à un
        simple positionnement dans la zone claire de l'image).
      */}
      <section
        className="relative isolate overflow-hidden border-b border-accent-100 bg-accent-100 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <PageContainer className="flex flex-col items-start py-16 sm:py-24">
          <div className="flex max-w-2xl flex-col items-start gap-5 rounded-card bg-white/90 p-6 shadow-card backdrop-blur-sm sm:p-8">
            <Badge tone="accent">Concours CADEV 2026</Badge>
            <h1 className="text-4xl font-bold leading-tight text-ink-900 sm:text-5xl">
              Apprenez ce qui vous manque, enseignez ce que vous savez.
            </h1>
            <p className="text-lg text-ink-700">
              DevLink Africa met en relation les développeuses et développeurs d'Afrique selon leurs
              compétences complémentaires. Chaque proposition est accompagnée de son explication :
              vous savez toujours pourquoi un profil vous est proposé.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
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
          </div>
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
