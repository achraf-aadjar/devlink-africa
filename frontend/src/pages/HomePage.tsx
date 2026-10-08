import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Icon, { type IconName } from '../components/icons/Icon'
import PageContainer from '../components/PageContainer'
import { useAuth } from '../features/auth/hooks/useAuth'
import { cn } from '../lib/cn'
import { useReveal } from '../lib/useReveal'

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

/** Les quatre formes d'échange, chacune avec ce qu'elle apporte concrètement. */
const EXCHANGE_KINDS: Array<{ icon: IconName; label: string; text: string }> = [
  {
    icon: 'mentoring',
    label: 'Mentorat',
    text: 'Une personne plus avancée accompagne l’autre sur une compétence, à son rythme, sur quelques séances.',
  },
  {
    icon: 'debugging',
    label: 'Revue de code',
    text: 'Un regard extérieur sur votre code : lisibilité, sécurité, bonnes pratiques. On apprend des deux côtés.',
  },
  {
    icon: 'exchange',
    label: 'Pair programming',
    text: 'Deux personnes, un écran partagé, un problème réel. Le moyen le plus rapide de transmettre un savoir-faire.',
  },
  {
    icon: 'project',
    label: 'Projet commun',
    text: 'Construire ensemble quelque chose qui tourne vraiment, et repartir avec une preuve à montrer.',
  },
]

/** Chiffres tirés du produit lui-même (docs/api.md, carte des pays), aucun inventé. */
const FACTS: Array<{ value: string; label: string }> = [
  { value: '54', label: 'pays africains couverts' },
  { value: '6', label: 'critères dans chaque score' },
  { value: '4', label: "formes d'échange" },
  { value: '100 %', label: 'des propositions expliquées' },
]

/**
 * Répartition d'un score d'exemple, reprise telle quelle de docs/api.md
 * (route de détail d'un match). Illustration seulement : aucune vraie personne.
 */
const SAMPLE_BREAKDOWN: Array<{ label: string; points: number; weight: number }> = [
  { label: 'Complémentarité', points: 31.5, weight: 35 },
  { label: 'Réciprocité', points: 20, weight: 20 },
  { label: 'Envie de collaborer', points: 11, weight: 15 },
  { label: 'Technologies communes', points: 10, weight: 10 },
  { label: 'Disponibilité', points: 5, weight: 10 },
  { label: 'Domaine', points: 5, weight: 10 },
]

const PRINCIPLES: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: 'exchange',
    title: 'Réciprocité d’abord',
    text: 'Un match à sens unique est plafonné : on privilégie les paires où chacun a quelque chose à apprendre à l’autre.',
  },
  {
    icon: 'info',
    title: 'Rien de magique',
    text: 'Chaque score se lit critère par critère. Vous savez toujours pourquoi un profil vous est proposé.',
  },
  {
    icon: 'proof',
    title: 'Des preuves concrètes',
    text: 'Après un échange, ce que vous avez produit ensemble reste visible sur votre profil.',
  },
]

/**
 * Bloc qui apparaît en glissant vers le haut quand il entre dans l'écran.
 * `delay` décale l'apparition, pour que les cartes d'une grille arrivent l'une
 * après l'autre plutôt que d'un bloc.
 */
function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'li'
}) {
  const { ref, visible } = useReveal<HTMLDivElement & HTMLLIElement>()
  return (
    <Tag
      ref={ref}
      className={cn('reveal', visible && 'is-visible', className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}

/**
 * Pastille décorative flottante : purement visuelle (aria-hidden), masquée sur
 * petit écran pour ne jamais gêner la lecture ni déborder. Elle monte et
 * descend doucement ; `delay` évite qu'elles bougent toutes en même temps.
 */
function FloatingChip({
  icon,
  label,
  className,
  delay,
}: {
  icon: IconName
  label: string
  className: string
  delay: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute hidden xl:block', className)}
    >
      <div
        className="flex animate-float items-center gap-2 rounded-full border border-accent-300/60 bg-ink-100/80 px-3 py-2 text-sm font-medium text-ink-800 shadow-[0_0_24px_-6px_rgba(56,139,253,0.55)] backdrop-blur"
        style={{ animationDelay: delay }}
      >
        <Icon name={icon} size={18} className="text-accent-700" />
        {label}
      </div>
    </div>
  )
}

function SectionHeading({
  id,
  eyebrow,
  title,
  text,
}: {
  id: string
  eyebrow: string
  title: ReactNode
  text: string
}) {
  return (
    <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-700">
        {eyebrow}
      </span>
      <h2 id={id} className="text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">
        {title}
      </h2>
      <p className="text-lg text-ink-600">{text}</p>
    </Reveal>
  )
}

/** Carte de match d'exemple : les barres se remplissent quand elle apparaît. */
function SampleMatchCard() {
  const { ref, visible } = useReveal<HTMLDivElement>()
  const total = SAMPLE_BREAKDOWN.reduce((sum, item) => sum + item.points, 0)

  return (
    <div
      ref={ref}
      className={cn(
        'reveal surface relative p-7 shadow-[0_0_80px_-20px_rgba(56,139,253,0.6)] backdrop-blur',
        visible && 'is-visible',
      )}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Exemple de match
          </p>
          <p className="mt-1 text-lg font-semibold text-ink-900">Pourquoi ce profil ?</p>
        </div>
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-accent-500 bg-accent-50 shadow-[0_0_30px_-4px_rgba(56,139,253,0.7)]">
          <span className="text-xl font-bold text-ink-900">{total}</span>
          <span className="text-[10px] text-ink-600">/ 100</span>
        </div>
      </div>

      <ul className="flex flex-col gap-3.5">
        {SAMPLE_BREAKDOWN.map((item, index) => (
          <li key={item.label}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-ink-800">{item.label}</span>
              <span className="font-mono text-ink-600">
                {item.points} / {item.weight}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-200">
              <div
                className={cn(
                  'h-full origin-left rounded-full bg-gradient-to-r from-[#1f6feb] to-[#79c0ff]',
                  visible ? 'animate-bar-fill' : 'scale-x-0',
                )}
                style={{
                  width: `${(item.points / item.weight) * 100}%`,
                  animationDelay: `${200 + index * 120}ms`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-5 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-inset ring-white/[0.07] text-sm leading-relaxed text-ink-700">
        <Icon name="info" size={16} className="mr-1.5 inline text-accent-700" />
        Vous voulez apprendre React, elle veut apprendre Django : vos compétences se complètent dans
        les deux sens.
      </p>
    </div>
  )
}

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex flex-col overflow-x-clip">
      {/* ——— Bannière ——— */}
      <section className="relative isolate overflow-hidden border-b border-ink-200">
        {/* Effets de fond façon github.com : grille estompée et halos bleus. */}
        <div aria-hidden="true" className="bg-aurora absolute inset-0 -z-10" />
        <div
          aria-hidden="true"
          className="glow-blob -z-10 inset-x-0 top-[-10rem] mx-auto h-[32rem] w-[48rem] max-w-full animate-glow bg-[#1f6feb]/40"
        />
        <div
          aria-hidden="true"
          className="glow-blob -z-10 right-[-8rem] top-40 h-80 w-80 animate-glow bg-[#a371f7]/25"
          style={{ animationDelay: '-4s' }}
        />

        <FloatingChip
          icon="mentoring"
          label="Mentorat"
          delay="0s"
          className="left-6 top-20 -rotate-6 lg:left-16"
        />
        <FloatingChip
          icon="debugging"
          label="Revue de code"
          delay="-1.5s"
          className="right-6 top-32 rotate-3 lg:right-20"
        />
        <FloatingChip
          icon="project"
          label="Projet commun"
          delay="-3s"
          className="bottom-20 left-10 rotate-3 lg:left-24"
        />
        <FloatingChip
          icon="match"
          label="Dev Match"
          delay="-4.5s"
          className="bottom-28 right-8 -rotate-3 lg:right-16"
        />

        <PageContainer className="relative flex flex-col items-center gap-6 py-24 text-center sm:py-32">
          <span className="animate-fade-in rounded-full border border-accent-300/70 bg-accent-50/80 px-4 py-1.5 text-sm font-semibold text-accent-800 shadow-[0_0_20px_-4px_rgba(56,139,253,0.6)]">
            Concours CADEV 2026
          </span>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-ink-900 sm:text-5xl lg:text-7xl">
            Apprenez ce qui vous manque,{' '}
            <span className="text-gradient">enseignez ce que vous savez</span>.
          </h1>
          <p className="max-w-2xl text-lg text-ink-700 sm:text-xl">
            DevLink Africa met en relation les développeuses et développeurs d'Afrique selon leurs
            compétences complémentaires. Chaque proposition est accompagnée de son explication :
            vous savez toujours pourquoi un profil vous est proposé.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link to="/matchs" className="btn-glow">
                Voir mes matchs
              </Link>
            ) : (
              <>
                <Link to="/inscription" className="btn-glow">
                  Créer mon compte
                </Link>
                <Link
                  to="/recherche"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/[0.06] px-6 py-3 ring-1 ring-inset ring-white/15 text-base font-semibold text-ink-900 backdrop-blur transition hover:bg-white/10"
                >
                  Explorer les profils
                </Link>
              </>
            )}
          </div>
        </PageContainer>
      </section>

      {/* ——— Chiffres clés ——— */}
      <section aria-label="En quelques chiffres" className="border-b border-ink-200 bg-ink-100/40">
        <PageContainer className="py-10">
          <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {FACTS.map((fact, index) => (
              <Reveal
                key={fact.label}
                delay={index * 100}
                className="flex flex-col items-center text-center"
              >
                <dt className="order-2 mt-1 text-sm text-ink-600">{fact.label}</dt>
                <dd className="text-gradient text-4xl font-bold sm:text-5xl">{fact.value}</dd>
              </Reveal>
            ))}
          </dl>
        </PageContainer>
      </section>

      {/* ——— Comment ça marche ——— */}
      <section aria-labelledby="comment" className="py-20 sm:py-24">
        <PageContainer className="flex flex-col gap-14">
          <SectionHeading
            id="comment"
            eyebrow="Comment ça marche"
            title="Quatre étapes, de l'inscription au premier échange"
            text="Pas de questionnaire interminable : quelques minutes suffisent pour recevoir vos premières propositions."
          />
          <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Ligne lumineuse qui relie les étapes, sur grand écran. */}
            <div
              aria-hidden="true"
              className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-gradient-to-r from-transparent via-accent-500 to-transparent lg:block"
            />
            {STEPS.map((step, index) => (
              <Reveal
                as="li"
                key={step.title}
                delay={index * 120}
                className="relative flex flex-col items-center gap-3 text-center"
              >
                <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-accent-400/70 bg-ink-100 text-accent-800 shadow-[0_0_30px_-4px_rgba(56,139,253,0.7)]">
                  <Icon name={step.icon} size={24} />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#1f6feb] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                </span>
                <h3 className="text-lg font-semibold text-ink-900">{step.title}</h3>
                <p className="max-w-[16rem] text-sm leading-relaxed text-ink-600">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </PageContainer>
      </section>

      {/* ——— Dev Match expliqué ——— */}
      <section
        aria-labelledby="devmatch"
        className="relative isolate border-y border-ink-200 bg-ink-100/30 py-20 sm:py-24"
      >
        <div
          aria-hidden="true"
          className="glow-blob -z-10 bottom-0 right-1/4 h-96 w-96 animate-glow bg-[#1f6feb]/25"
        />
        <PageContainer className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="flex flex-col gap-5">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-700">
              Dev Match
            </span>
            <h2 id="devmatch" className="text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">
              Un score que vous pouvez <span className="text-gradient">lire</span>, pas une boîte
              noire.
            </h2>
            <p className="text-lg text-ink-600">
              Chaque match est noté sur 100 à partir de six critères pondérés. Vous voyez combien de
              points chaque critère rapporte, et une phrase résume pourquoi vos profils se
              complètent.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                'La complémentarité pèse le plus : ce que l’un sait, l’autre veut l’apprendre.',
                'Un match sans réciprocité ne peut pas atteindre un score élevé.',
                'Votre avis sur un match est enregistré, mais ne modifie jamais le score.',
              ].map((line) => (
                <li key={line} className="flex gap-3 text-ink-700">
                  <Icon name="check" size={20} className="mt-0.5 text-accent-700" />
                  {line}
                </li>
              ))}
            </ul>
          </Reveal>
          <SampleMatchCard />
        </PageContainer>
      </section>

      {/* ——— Formes d'échange ——— */}
      <section aria-labelledby="echanges" className="py-20 sm:py-24">
        <PageContainer className="flex flex-col gap-12">
          <SectionHeading
            id="echanges"
            eyebrow="Échanger"
            title="Quatre façons de travailler ensemble"
            text="Choisissez la forme qui vous convient. Vous pouvez en essayer plusieurs avec la même personne."
          />
          <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {EXCHANGE_KINDS.map((kind, index) => (
              <Reveal
                as="li"
                key={kind.label}
                delay={index * 100}
                className="group flex flex-col items-center text-center"
              >
                <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#1f6feb] to-[#a371f7] text-white shadow-glow transition duration-300 group-hover:-translate-y-1 group-hover:scale-105">
                  <Icon name={kind.icon} size={28} />
                </span>
                <h3 className="mb-2 text-lg font-semibold text-ink-900">{kind.label}</h3>
                <p className="text-sm leading-relaxed text-ink-600">{kind.text}</p>
              </Reveal>
            ))}
          </ul>
        </PageContainer>
      </section>

      {/* ——— Nos principes ——— */}
      <section aria-labelledby="principes" className="border-t border-ink-200 py-20 sm:py-24">
        <PageContainer className="flex flex-col gap-12">
          <SectionHeading
            id="principes"
            eyebrow="Nos principes"
            title="Pensé pour que les deux côtés y gagnent"
            text="DevLink Africa n’est pas un annuaire : c’est un outil pour trouver la bonne personne avec qui progresser."
          />
          <ul className="grid gap-12 md:grid-cols-3 md:divide-x md:divide-white/[0.06]">
            {PRINCIPLES.map((item, index) => (
              <Reveal
                as="li"
                key={item.title}
                delay={index * 120}
                className="flex flex-col items-center px-4 text-center"
              >
                <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05] text-accent-800 ring-1 ring-inset ring-accent-400/30">
                  <Icon name={item.icon} size={26} />
                </span>
                <h3 className="mb-2 text-lg font-semibold text-ink-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-ink-600">{item.text}</p>
              </Reveal>
            ))}
          </ul>
        </PageContainer>
      </section>

      {/* ——— Appel final ——— */}
      <section aria-labelledby="final" className="relative isolate overflow-hidden py-24">
        <div aria-hidden="true" className="bg-aurora absolute inset-0 -z-10" />
        <div
          aria-hidden="true"
          className="glow-blob -z-10 inset-x-0 top-1/2 -mt-40 mx-auto h-80 w-[40rem] max-w-full animate-glow bg-[#1f6feb]/35"
        />
        <PageContainer>
          <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <h2 id="final" className="text-3xl font-bold leading-tight text-ink-900 sm:text-5xl">
              Votre prochain binôme{' '}
              <span className="text-gradient">vous attend peut-être déjà</span>.
            </h2>
            <p className="text-lg text-ink-600">
              Créez votre profil, ajoutez vos compétences, et découvrez qui peut vous apprendre ce
              qui vous manque.
            </p>
            <Link to={isAuthenticated ? '/matchs' : '/inscription'} className="btn-glow">
              {isAuthenticated ? 'Voir mes matchs' : 'Créer mon compte'}
            </Link>
          </Reveal>
        </PageContainer>
      </section>
    </div>
  )
}
