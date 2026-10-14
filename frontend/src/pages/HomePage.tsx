import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ScorePlate from '../components/ScorePlate'
import PageContainer from '../components/PageContainer'
import { buttonClasses } from '../components/ui/buttonStyles'
import { useAuth } from '../features/auth/hooks/useAuth'
import CircleDiagram from '../features/circles/components/CircleDiagram'
import { DEMO_CIRCLE } from '../features/circles/demoCircle'
import { listCatalog } from '../features/skills/api/skills'
import { msg } from '../i18n/translate'
import { useI18n } from '../i18n/useI18n'
import { useQuery } from '../lib/useQuery'

/** Les quatre formes d'échange, chacune avec ce qu'elle apporte concrètement. */
const EXCHANGE_KINDS: Array<{ label: string; text: string; ideal: string }> = [
  {
    label: msg('Mentorat'),
    ideal: msg('Progresser sur une compétence précise'),
    text: msg(
      'Une personne plus avancée accompagne l’autre sur une compétence, à son rythme, sur quelques séances.',
    ),
  },
  {
    label: msg('Revue de code'),
    ideal: msg('Un code déjà écrit, à rendre plus solide'),
    text: msg(
      'Un regard extérieur sur votre code : lisibilité, sécurité, bonnes pratiques. On apprend des deux côtés.',
    ),
  },
  {
    label: msg('Pair programming'),
    ideal: msg('Débloquer un problème concret, à deux'),
    text: msg(
      'Deux personnes, un écran partagé, un problème réel. Le moyen le plus rapide de transmettre un savoir-faire.',
    ),
  },
  {
    label: msg('Projet commun'),
    ideal: msg('Repartir avec une réalisation à montrer'),
    text: msg(
      'Construire ensemble quelque chose qui tourne vraiment, et repartir avec une preuve à montrer.',
    ),
  },
]

/**
 * Répartition d'un score d'exemple, reprise telle quelle de docs/api.md
 * (route de détail d'un match). Illustration seulement : aucune vraie personne.
 */
const SAMPLE_BREAKDOWN: Array<{ label: string; points: number; weight: number }> = [
  { label: msg('Complémentarité'), points: 31.5, weight: 35 },
  { label: msg('Réciprocité'), points: 20, weight: 20 },
  { label: msg('Envie de collaborer'), points: 11, weight: 15 },
  { label: msg('Technologies communes'), points: 10, weight: 10 },
  { label: msg('Disponibilité'), points: 5, weight: 10 },
  { label: msg('Domaine'), points: 5, weight: 10 },
]

/** Compétences proposées si le catalogue ne répond pas : toutes existent dans la démo. */
const FALLBACK_SKILLS = [
  'React',
  'TypeScript',
  'Python',
  'FastAPI',
  'Docker',
  'Flutter',
  'Node.js',
  'Kubernetes',
]

/**
 * La feuille de match épinglée au tableau : un vrai formulaire. Elle ouvre la
 * recherche sur les personnes qui savent ce que vous voulez apprendre, et qui
 * veulent apprendre ce que vous savez.
 */
function MatchSheet() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const catalog = useQuery(() => listCatalog(), [])
  const fromCatalog = catalog.data?.results?.map((skill) => skill.name) ?? []
  const names = fromCatalog.length > 0 ? fromCatalog : FALLBACK_SKILLS
  const [offered, setOffered] = useState('React')
  const [wanted, setWanted] = useState('Docker')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (wanted) params.set('skill', wanted)
    if (offered) params.set('skill_wanted', offered)
    navigate(`/recherche?${params.toString()}`)
  }

  const fieldClass = 'field w-full font-semibold text-ink-900'

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="feuille-de-match"
      className="relative w-full max-w-xl rounded-md bg-ink-100 shadow-sheet ring-1 ring-ink-900 sm:-rotate-[0.6deg]"
    >
      {/* L'aimant qui tient la feuille au tableau. */}
      <span
        aria-hidden="true"
        className="absolute -top-2.5 left-8 h-5 w-5 rounded-full bg-brand shadow-magnet"
      />
      <div className="flex items-center justify-between border-b-2 border-ink-900 px-4 py-2.5">
        <h2 id="feuille-de-match" className="sheet-title">
          {t('Votre feuille de match')}
        </h2>
        <span className="text-sm text-ink-600">{t('Vous')}</span>
      </div>
      <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-ink-900/80">
        <label className="flex flex-col gap-2 px-4 py-3">
          <span className="font-display text-base font-bold uppercase tracking-[0.02em] text-accent-700">
            {t('Je sais faire')}
          </span>
          <select
            value={offered}
            onChange={(event) => setOffered(event.target.value)}
            className={`${fieldClass} border-ink-300`}
          >
            {names.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 border-t border-ink-900/80 px-4 py-3 sm:border-t-0">
          <span className="font-display text-base font-bold uppercase tracking-[0.02em] text-demand">
            {t('Je veux apprendre')}
          </span>
          <select
            value={wanted}
            onChange={(event) => setWanted(event.target.value)}
            className={`${fieldClass} border-ink-300`}
          >
            {names.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="px-4 pb-4 pt-1">
        <button type="submit" className={buttonClasses('primary', 'lg', 'w-full')}>
          {t('Voir qui me complète')}
        </button>
      </div>
    </form>
  )
}

/** Le premier écran : le tableau tactique, avec le cercle de la démo tracé dessus. */
function Board({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { t } = useI18n()

  return (
    <section aria-labelledby="accueil-titre" className="px-3 pb-10 pt-3 sm:px-6 sm:pt-6">
      {/* Le cadre alu du tableau, puis l'émail. */}
      <div className="mx-auto max-w-[90rem] rounded-[0.875rem] bg-ink-300 p-1.5 sm:p-2.5">
        <div className="relative overflow-hidden rounded-md bg-ink-50 px-5 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-10 lg:min-h-[calc(100svh-8rem)]">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-6">
            <div className="flex flex-col gap-8">
              <div>
                <h1
                  id="accueil-titre"
                  className="font-display text-[2.75rem] font-bold uppercase leading-[0.92] text-ink-900 sm:text-[4rem] xl:text-[4.75rem]"
                >
                  {t('Apprenez ce qui vous manque,')}{' '}
                  <span className="text-accent-700">{t('enseignez ce que vous savez')}</span>.
                </h1>
                <p className="mt-5 max-w-xl text-lg text-ink-700">
                  {t(
                    "DevLink Africa met en relation les développeuses et développeurs d'Afrique selon leurs compétences complémentaires. Chaque proposition est accompagnée de son explication : vous savez toujours pourquoi un profil vous est proposé.",
                  )}
                </p>
              </div>

              <MatchSheet />

              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
                {isAuthenticated ? (
                  <Link to="/matchs" className={buttonClasses('secondary', 'md')}>
                    {t('Voir mes matchs')}
                  </Link>
                ) : (
                  <>
                    <Link to="/inscription" className={buttonClasses('secondary', 'md')}>
                      {t('Créer mon compte')}
                    </Link>
                    <Link to="/recherche" className="font-semibold text-accent-700 underline">
                      {t('Explorer les profils')}
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Le cercle tracé au feutre, avec la note de l'entraîneur. */}
            <figure className="flex flex-col items-center justify-center gap-4 lg:pb-16">
              <CircleDiagram circle={DEMO_CIRCLE} className="max-w-[30rem]" />
              <figcaption className="max-w-sm text-center text-ink-700">
                <span>
                  <span className="block font-display text-xl font-bold uppercase leading-tight text-ink-900">
                    {t('Quand aucune paire n’existe, un cercle.')}
                  </span>
                  <span className="text-sm">
                    {t('Le cercle de la démonstration : Dakar → Accra → Nairobi.')}{' '}
                    {t('Personnes fictives.')}
                  </span>
                </span>
              </figcaption>
            </figure>
          </div>

          {/* La plaque de score, en bas à droite du tableau. */}
          <div className="mt-8 flex items-center justify-end gap-3 lg:absolute lg:bottom-10 lg:right-10 lg:mt-0">
            <span className="text-sm text-ink-600">{t('Score du cercle')}</span>
            <ScorePlate score={DEMO_CIRCLE.score} size="md" showMax />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Feuille de stats d'exemple : une barre de 100 points, puis le détail. */
function SampleStats() {
  const { t, lang } = useI18n()
  const total = SAMPLE_BREAKDOWN.reduce((sum, item) => sum + item.points, 0)
  // Même format que la plaque de score : « 82,5 » en français.
  const format = (points: number) =>
    points.toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 1 })

  return (
    <figure className="surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-ink-300 pb-4">
        <figcaption>
          <span className="sheet-title block">{t('Pourquoi ce profil ?')}</span>
          <span className="text-sm text-ink-600">{t('Exemple de match')}</span>
        </figcaption>
        <ScorePlate score={total} size="md" showMax precise />
      </div>

      <div aria-hidden="true" className="mt-5 flex h-4 gap-0.5 overflow-hidden rounded-sm">
        {SAMPLE_BREAKDOWN.map((item) => (
          <div
            key={item.label}
            className="relative h-full bg-ink-200"
            style={{ flexGrow: item.weight, flexBasis: 0 }}
          >
            <div
              className="absolute inset-y-0 left-0 bg-brand"
              style={{ width: `${(item.points / item.weight) * 100}%` }}
            />
          </div>
        ))}
      </div>

      <table className="mt-4 w-full text-sm">
        <caption className="sr-only">{t('Points obtenus par critère')}</caption>
        <tbody>
          {SAMPLE_BREAKDOWN.map((item) => (
            <tr key={item.label} className="border-b border-ink-200 last:border-0">
              <th scope="row" className="py-2 text-left font-medium text-ink-800">
                {t(item.label)}
              </th>
              <td className="py-2 text-right font-semibold tabular-nums text-ink-900">
                {format(item.points)}
              </td>
              <td className="w-12 py-2 text-right tabular-nums text-ink-600">/ {item.weight}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink-900">
            <th scope="row" className="pt-2.5 text-left font-semibold text-ink-900">
              {t('Total')}
            </th>
            <td className="pt-2.5 text-right font-display text-xl font-bold tabular-nums text-ink-900">
              {format(total)}
            </td>
            <td className="w-12 pt-2.5 text-right tabular-nums text-ink-600">/ 100</td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-4 border-t border-ink-200 pt-3 text-sm text-ink-700">
        {t(
          'Vous voulez apprendre React, elle veut apprendre Django : vos compétences se complètent dans les deux sens.',
        )}
      </p>
    </figure>
  )
}

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const { t, lang, setLang } = useI18n()
  const linkClass =
    'inline-flex items-center gap-1 text-sm font-semibold text-accent-700 underline underline-offset-4 hover:text-accent-800'

  return (
    <div className="flex flex-col overflow-x-clip">
      <Board isAuthenticated={isAuthenticated} />

      {/* ——— Dev Match expliqué ——— */}
      <section aria-labelledby="devmatch" className="border-t border-ink-300 py-16 sm:py-20">
        <PageContainer className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16">
          <div className="flex max-w-2xl flex-col gap-5">
            <h2
              id="devmatch"
              className="font-display text-[2.25rem] font-bold leading-[1.02] text-ink-900 sm:text-5xl"
            >
              {t('Un score que vous pouvez')} {t('lire')}
              {t(', pas une boîte noire.')}
            </h2>
            <p className="text-lg text-ink-700">
              {t(
                'Chaque match est noté sur 100 à partir de six critères pondérés. Vous voyez combien de points chaque critère rapporte, et une phrase résume pourquoi vos profils se complètent.',
              )}
            </p>
            <ul className="flex flex-col divide-y divide-ink-300 border-y border-ink-300">
              {[
                {
                  title: t('Réciprocité d’abord'),
                  text: t(
                    'Un match à sens unique est plafonné : on privilégie les paires où chacun a quelque chose à apprendre à l’autre.',
                  ),
                },
                {
                  title: t('Rien de magique'),
                  text: t(
                    'Chaque score se lit critère par critère. Vous savez toujours pourquoi un profil vous est proposé.',
                  ),
                },
                {
                  title: t('Des preuves concrètes'),
                  text: t(
                    'Dépôts de code, certifications, contributions open source : chaque compétence peut s’appuyer sur des preuves.',
                  ),
                },
              ].map((item) => (
                <li key={item.title} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-6">
                  <h3 className="font-display text-lg font-bold uppercase leading-tight text-ink-900">
                    {item.title}
                  </h3>
                  <p className="text-ink-700">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <SampleStats />
        </PageContainer>
      </section>

      {/* ——— Formes d'échange : une feuille, quatre lignes ——— */}
      <section aria-labelledby="echanges" className="border-t border-ink-300 py-16 sm:py-20">
        <PageContainer className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2
              id="echanges"
              className="font-display text-[2.25rem] font-bold leading-[1.02] text-ink-900 sm:text-5xl"
            >
              {t('Quatre façons de travailler ensemble')}
            </h2>
            <p className="max-w-md text-ink-700">
              {t(
                'Choisissez la forme qui vous convient. Vous pouvez en essayer plusieurs avec la même personne.',
              )}
            </p>
          </div>
          {/* Une feuille à colonnes fixes, comme un tableau des départs : les
              lignes changent, les colonnes jamais. */}
          <div className="border-t-2 border-ink-900">
            <div
              aria-hidden="true"
              className="hidden grid-cols-[14rem_minmax(0,1fr)_18rem] gap-8 border-b border-ink-300 py-2.5 font-display text-[0.9375rem] font-bold uppercase tracking-[0.02em] text-ink-600 md:grid"
            >
              <span>{t('Format')}</span>
              <span>{t('Comment ça se passe')}</span>
              <span>{t('Idéal pour')}</span>
            </div>
            <ul className="divide-y divide-ink-300">
              {EXCHANGE_KINDS.map((kind) => (
                <li
                  key={kind.label}
                  className="grid gap-2 py-5 md:grid-cols-[14rem_minmax(0,1fr)_18rem] md:items-baseline md:gap-8"
                >
                  <h3 className="font-display text-2xl font-bold uppercase leading-tight text-ink-900">
                    {t(kind.label)}
                  </h3>
                  <p className="text-ink-700">{t(kind.text)}</p>
                  <p className="font-semibold text-ink-900">{t(kind.ideal)}</p>
                </li>
              ))}
            </ul>
          </div>
        </PageContainer>
      </section>

      {/* ——— Au-delà de la paire ——— */}
      <section aria-labelledby="distinction" className="border-t border-ink-300 py-16 sm:py-20">
        <PageContainer className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
          <div className="flex flex-col gap-4">
            <h2
              id="distinction"
              className="font-display text-[2.25rem] font-bold leading-[1.02] text-ink-900 sm:text-5xl"
            >
              {t('Au-delà de la paire parfaite')}
            </h2>
            <p className="text-lg text-ink-700">
              {t(
                'Aminata, à Dakar, veut apprendre Docker. Imani, à Nairobi, l’enseigne mais veut FastAPI. Kwame, à Accra, enseigne FastAPI et veut React, qu’Aminata maîtrise. Aucune paire ne fonctionne ; le cercle, si.',
              )}
            </p>
            <p className="text-ink-700">
              {t(
                'DevLink trouve ces boucles de trois ou quatre personnes où chacun apprend au suivant. Les contacts se débloquent quand tout le monde a accepté.',
              )}
            </p>
            {isAuthenticated && (
              <Link to="/cercles" className={linkClass}>
                {t('Voir mes cercles')}
              </Link>
            )}
          </div>

          <ul className="flex flex-col divide-y divide-ink-300 border-y border-ink-300">
            <li className="flex flex-col gap-2 py-5">
              <h3 className="font-display text-2xl font-bold uppercase leading-tight text-ink-900">
                {t('Un observatoire du continent')}
              </h3>
              <p className="text-ink-700">
                {t(
                  'Les compétences qui manquent, celles qu’on peut partager, et les ponts entre pays. Que des chiffres, aucun nom.',
                )}
              </p>
              <Link to="/observatoire" className={linkClass}>
                {t("Ouvrir l'observatoire")}
              </Link>
            </li>
            <li className="flex flex-col gap-2 py-5">
              <h3 className="font-display text-2xl font-bold uppercase leading-tight text-ink-900">
                {t('Des compétences validées par les pairs')}
              </h3>
              <p className="text-ink-700">
                {t(
                  'Après un échange terminé, votre partenaire peut valider la compétence que vous lui avez transmise. Sa validation, à son nom, s’affiche sur votre profil.',
                )}
              </p>
            </li>
            <li className="flex flex-col gap-2 py-5">
              <h3 className="font-display text-2xl font-bold uppercase leading-tight text-ink-900">
                {t('En français et en anglais')}
              </h3>
              <p className="text-ink-700">
                {t(
                  'Du Sénégal au Kenya, en passant par le Ghana et le Nigeria : toute la plateforme passe d’une langue à l’autre en un clic.',
                )}
              </p>
              {lang === 'fr' ? (
                <button
                  type="button"
                  lang="en"
                  onClick={() => setLang('en')}
                  className={`${linkClass} w-fit`}
                >
                  Switch to English
                </button>
              ) : (
                <button
                  type="button"
                  lang="fr"
                  onClick={() => setLang('fr')}
                  className={`${linkClass} w-fit`}
                >
                  {t('Passer en français')}
                </button>
              )}
            </li>
          </ul>
        </PageContainer>
      </section>

      {/* ——— Appel final : la barre du tableau d'affichage ——— */}
      <section aria-labelledby="final" className="bg-bar py-14 text-bar-text sm:py-16">
        <PageContainer className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <h2
            id="final"
            className="max-w-3xl font-display text-[2.25rem] font-bold uppercase leading-[0.98] text-white sm:text-5xl"
          >
            {t('Votre prochain binôme')} {t('vous attend peut-être déjà')}.
          </h2>
          <Link
            to={isAuthenticated ? '/matchs' : '/inscription'}
            className={buttonClasses('primary', 'lg', 'shrink-0')}
          >
            {isAuthenticated ? t('Voir mes matchs') : t('Créer mon compte')}
          </Link>
        </PageContainer>
      </section>
    </div>
  )
}
