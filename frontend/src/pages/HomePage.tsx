import { Link } from 'react-router-dom'
import Icon, { type IconName } from '../components/icons/Icon'
import PageContainer from '../components/PageContainer'
import { useAuth } from '../features/auth/hooks/useAuth'
import CircleDiagram from '../features/circles/components/CircleDiagram'
import { msg } from '../i18n/translate'
import { useI18n } from '../i18n/useI18n'
import type { Circle } from '../lib/types'

const STEPS: Array<{ title: string; text: string }> = [
  {
    title: msg('Votre profil'),
    text: msg('Pays, bio, disponibilités : dites qui vous êtes en deux minutes.'),
  },
  {
    title: msg('Vos compétences'),
    text: msg('Ce que vous savez faire, et ce que vous voulez apprendre.'),
  },
  {
    title: msg('Dev Match'),
    text: msg("Des profils complémentaires, avec le détail du score et l'explication."),
  },
  {
    title: msg('Un échange'),
    text: msg('Mentorat, revue de code, pair programming, projet commun.'),
  },
]

/** Les quatre formes d'échange, chacune avec ce qu'elle apporte concrètement. */
const EXCHANGE_KINDS: Array<{ icon: IconName; label: string; text: string }> = [
  {
    icon: 'mentoring',
    label: msg('Mentorat'),
    text: msg(
      'Une personne plus avancée accompagne l’autre sur une compétence, à son rythme, sur quelques séances.',
    ),
  },
  {
    icon: 'debugging',
    label: msg('Revue de code'),
    text: msg(
      'Un regard extérieur sur votre code : lisibilité, sécurité, bonnes pratiques. On apprend des deux côtés.',
    ),
  },
  {
    icon: 'exchange',
    label: msg('Pair programming'),
    text: msg(
      'Deux personnes, un écran partagé, un problème réel. Le moyen le plus rapide de transmettre un savoir-faire.',
    ),
  },
  {
    icon: 'project',
    label: msg('Projet commun'),
    text: msg(
      'Construire ensemble quelque chose qui tourne vraiment, et repartir avec une preuve à montrer.',
    ),
  },
]

/**
 * Chiffres tirés du produit lui-même (docs/api.md, carte des pays), aucun inventé.
 * `value` passe aussi par la traduction : « 100 % » s'écrit « 100% » en anglais.
 */
const FACTS: Array<{ value: string; label: string }> = [
  { value: '54', label: msg('pays africains couverts') },
  { value: '6', label: msg('critères dans chaque score') },
  { value: '4', label: msg("formes d'échange") },
  { value: msg('100 %'), label: msg('des propositions expliquées') },
]

/**
 * Les six critères du score, avec leur poids (backend/matching/scoring.py) et
 * ce qu'ils mesurent. `points` : la répartition d'un exemple repris de
 * docs/api.md (route de détail d'un match) ; aucune vraie personne.
 */
const CRITERIA: Array<{ label: string; points: number; weight: number; text: string }> = [
  {
    label: msg('Complémentarité'),
    points: 31.5,
    weight: 35,
    text: msg('Ce que l’un sait et que l’autre veut apprendre, selon le niveau déclaré.'),
  },
  {
    label: msg('Réciprocité'),
    points: 20,
    weight: 20,
    text: msg('L’échange va-t-il dans les deux sens ?'),
  },
  {
    label: msg('Envie de collaborer'),
    points: 11,
    weight: 15,
    text: msg(
      'Des disponibilités tournées vers le travail à deux : mentorat, projet, open source.',
    ),
  },
  {
    label: msg('Technologies communes'),
    points: 10,
    weight: 10,
    text: msg('Un socle technique partagé, pour se comprendre vite.'),
  },
  {
    label: msg('Disponibilité'),
    points: 5,
    weight: 10,
    text: msg('Chacun a indiqué quand et comment il est disponible.'),
  },
  {
    label: msg('Domaine'),
    points: 5,
    weight: 10,
    text: msg('Un même domaine d’activité : web, mobile, données…'),
  },
]

const PRINCIPLES: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: 'exchange',
    title: msg('Réciprocité d’abord'),
    text: msg(
      'Un match à sens unique est plafonné : on privilégie les paires où chacun a quelque chose à apprendre à l’autre.',
    ),
  },
  {
    icon: 'info',
    title: msg('Rien de magique'),
    text: msg(
      'Chaque score se lit critère par critère. Vous savez toujours pourquoi un profil vous est proposé.',
    ),
  },
  {
    icon: 'proof',
    title: msg('Des preuves concrètes'),
    text: msg(
      'Dépôts de code, certifications, contributions open source : chaque compétence peut s’appuyer sur des preuves.',
    ),
  },
]

/**
 * Le cercle des données de démonstration (seed_demo) : trois profils fictifs,
 * aucune vraie personne. Aucun échange à deux ne les réunit ; le cercle, si.
 */
const SAMPLE_CIRCLE: Circle = {
  id: null,
  key: 'demo',
  status: 'SUGGESTED',
  score: 100,
  members: [
    { id: 1, full_name: 'Aminata Diallo', country: 'SN' },
    { id: 2, full_name: 'Kwame Boateng', country: 'GH' },
    { id: 3, full_name: 'Imani Wanjiru', country: 'KE' },
  ].map((member) => ({ ...member, is_demo: true, response: null, contact: null })),
  arrows: [
    { teacher: 1, learner: 2, skill: { name: 'React', level: 'ADVANCED' } },
    { teacher: 2, learner: 3, skill: { name: 'FastAPI', level: 'ADVANCED' } },
    { teacher: 3, learner: 1, skill: { name: 'Docker', level: 'ADVANCED' } },
  ],
  created_at: null,
  activated_at: null,
}

/** Titre de section et sa ligne d'introduction, centrés. */
function SectionTitle({ id, title, text }: { id: string; title: string; text?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <h2 id={id} className="text-[28px] font-bold leading-tight">
        {title}
      </h2>
      {text && <p className="mt-2 text-base text-ink-600">{text}</p>}
    </div>
  )
}

/** Exemple de match, présenté comme une capture du produit dans un panneau. */
function SampleMatchPanel() {
  const { t } = useI18n()
  const total = CRITERIA.reduce((sum, item) => sum + item.points, 0)

  return (
    <div className="surface overflow-hidden shadow-raised">
      <div className="flex items-center justify-between border-b border-ink-200 bg-ink-100 px-4 py-2.5">
        <div>
          <p className="text-sm font-bold text-ink-900">{t('Exemple de match')}</p>
          <p className="text-xs text-ink-500">{t('Pourquoi ce profil ?')}</p>
        </div>
        <p className="text-right">
          <span className="text-2xl font-bold text-ink-900">{total}</span>
          <span className="text-sm text-ink-500"> / 100</span>
        </p>
      </div>

      <ul className="flex flex-col gap-3 px-4 py-4">
        {CRITERIA.map((item) => (
          <li key={item.label}>
            <div className="mb-1 flex justify-between text-[13px]">
              <span className="text-ink-800">{t(item.label)}</span>
              <span className="font-mono text-ink-600">
                {item.points} / {item.weight}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-[3px] bg-ink-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
              <div
                className="h-full bg-[#337ab7]"
                style={{ width: `${(item.points / item.weight) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="mx-4 mb-4 rounded border border-[#bce8f1] bg-[#d9edf7] px-3 py-2 text-[13px] text-[#31708f]">
        {t(
          'Vous voulez apprendre React, elle veut apprendre Django : vos compétences se complètent dans les deux sens.',
        )}
      </p>
    </div>
  )
}

/** Ce qui distingue DevLink : les cercles, puis l'observatoire, les validations, l'anglais. */
function Distinctives({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { t, lang, setLang } = useI18n()
  const more = 'mt-2 inline-block text-sm font-bold text-accent-700 hover:underline'

  return (
    <section aria-labelledby="distinction" className="py-14">
      <PageContainer>
        <SectionTitle
          id="distinction"
          title={t('Au-delà de la paire parfaite')}
          text={t(
            "Un échange à deux suppose que chacun cherche exactement ce que l'autre sait. DevLink Africa va plus loin.",
          )}
        />

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <figure className="surface px-6 py-6">
            <CircleDiagram circle={SAMPLE_CIRCLE} />
            <figcaption className="mt-3 border-t border-ink-200 pt-3 text-center text-xs text-ink-500">
              {t('Le cercle de la démonstration : Dakar → Accra → Nairobi.')}
            </figcaption>
          </figure>
          <div>
            <h3 className="text-2xl font-bold">
              {t('Quand aucune paire n’existe,')} {t('un cercle')}.
            </h3>
            <p className="mt-3 text-base text-ink-700">
              {t(
                'Aminata, à Dakar, veut apprendre FastAPI. Kwame, à Accra, l’enseigne mais veut Docker. Imani, à Nairobi, enseigne Docker et veut React, qu’Aminata maîtrise. Aucune paire ne fonctionne ; le cercle, si.',
              )}
            </p>
            <p className="mt-3 text-ink-600">
              {t(
                'DevLink trouve ces boucles de trois ou quatre personnes où chacun apprend au suivant. Les contacts se débloquent quand tout le monde a accepté.',
              )}
            </p>
            {isAuthenticated && (
              <Link to="/cercles" className={more}>
                {t('Voir mes cercles')} »
              </Link>
            )}
          </div>
        </div>

        <ul className="mt-12 grid gap-8 border-t border-ink-200 pt-10 md:grid-cols-3">
          <li>
            <Icon name="map" size={28} className="mb-2 text-accent-500" />
            <h3 className="text-base font-bold">{t('Un observatoire du continent')}</h3>
            <p className="mt-1 text-ink-600">
              {t(
                'Les compétences qui manquent, celles qu’on peut partager, et les ponts entre pays. Que des chiffres, aucun nom.',
              )}
            </p>
            <Link to="/observatoire" className={more}>
              {t("Ouvrir l'observatoire")} »
            </Link>
          </li>
          <li>
            <Icon name="check" size={28} className="mb-2 text-accent-500" />
            <h3 className="text-base font-bold">{t('Des compétences validées par les pairs')}</h3>
            <p className="mt-1 text-ink-600">
              {t(
                'Après un échange terminé, votre partenaire peut valider la compétence que vous lui avez transmise. Sa validation, à son nom, s’affiche sur votre profil.',
              )}
            </p>
          </li>
          <li>
            <Icon name="country" size={28} className="mb-2 text-accent-500" />
            <h3 className="text-base font-bold">{t('En français et en anglais')}</h3>
            <p className="mt-1 text-ink-600">
              {t(
                'Du Sénégal au Kenya, en passant par le Ghana et le Nigeria : toute la plateforme passe d’une langue à l’autre en un clic.',
              )}
            </p>
            {lang === 'fr' ? (
              <button type="button" lang="en" onClick={() => setLang('en')} className={more}>
                Switch to English »
              </button>
            ) : (
              <button type="button" lang="fr" onClick={() => setLang('fr')} className={more}>
                {t('Passer en français')} »
              </button>
            )}
          </li>
        </ul>
      </PageContainer>
    </section>
  )
}

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const { t } = useI18n()

  return (
    <div className="-mb-10">
      {/* ——— Bandeau ——— */}
      <section className="border-b border-ink-200 bg-[#f7f7f7]">
        <PageContainer className="grid items-center gap-10 py-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1 className="text-[34px] font-bold leading-tight sm:text-[42px]">
              {t('Apprenez ce qui vous manque,')} {t('enseignez ce que vous savez')}.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-600">
              {t(
                "DevLink Africa met en relation les développeuses et développeurs d'Afrique selon leurs compétences complémentaires. Chaque proposition est accompagnée de son explication : vous savez toujours pourquoi un profil vous est proposé.",
              )}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link to="/matchs" className="btn btn-primary btn-lg">
                  {t('Voir mes matchs')}
                </Link>
              ) : (
                <>
                  <Link to="/inscription" className="btn btn-primary btn-lg">
                    {t('Créer mon compte')}
                  </Link>
                  <Link to="/recherche" className="btn btn-lg">
                    {t('Explorer les profils')}
                  </Link>
                </>
              )}
            </div>
            <p className="mt-4 text-xs text-ink-500">{t('Concours CADEV 2026')}</p>
          </div>
          <div className="lg:col-span-5">
            <SampleMatchPanel />
          </div>
        </PageContainer>
      </section>

      {/* ——— Chiffres clés ——— */}
      <section aria-label={t('En quelques chiffres')} className="border-b border-ink-200">
        <PageContainer>
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {FACTS.map((fact, index) => (
              <div
                key={fact.label}
                className={
                  index === 0
                    ? 'flex flex-col items-center py-6 text-center'
                    : 'flex flex-col items-center py-6 text-center lg:border-l lg:border-ink-200'
                }
              >
                <dt className="order-2 text-sm text-ink-500">{t(fact.label)}</dt>
                <dd className="text-3xl font-bold text-ink-900">{t(fact.value)}</dd>
              </div>
            ))}
          </dl>
        </PageContainer>
      </section>

      {/* ——— Comment ça marche ——— */}
      <section aria-labelledby="comment" className="py-14">
        <PageContainer>
          <SectionTitle
            id="comment"
            title={t("Quatre étapes, de l'inscription au premier échange")}
            text={t(
              'Pas de questionnaire interminable : quelques minutes suffisent pour recevoir vos premières propositions.',
            )}
          />
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#337ab7] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-bold">{t(step.title)}</h3>
                  <p className="mt-1 text-ink-600">{t(step.text)}</p>
                </div>
              </li>
            ))}
          </ol>
        </PageContainer>
      </section>

      {/* ——— Dev Match expliqué ——— */}
      <section aria-labelledby="devmatch" className="border-y border-ink-200 bg-[#f7f7f7] py-14">
        <PageContainer className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="devmatch" className="text-[28px] font-bold leading-tight">
              {t('Un score que vous pouvez')} {t('lire')}
              {t(', pas une boîte noire.')}
            </h2>
            <p className="mt-3 text-base text-ink-600">
              {t(
                'Chaque match est noté sur 100 à partir de six critères pondérés. Vous voyez combien de points chaque critère rapporte, et une phrase résume pourquoi vos profils se complètent.',
              )}
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {[
                t('La complémentarité pèse le plus : ce que l’un sait, l’autre veut l’apprendre.'),
                t('Un match sans réciprocité ne peut pas atteindre un score élevé.'),
                t('Votre avis sur un match est enregistré, mais ne modifie jamais le score.'),
              ].map((line) => (
                <li key={line} className="flex gap-2 text-ink-700">
                  <Icon name="check" size={18} className="mt-0.5 shrink-0 text-[#3c763d]" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <div className="surface overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-ink-200 bg-ink-100 text-[13px]">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-bold">
                      {t('Critère')}
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-bold">
                      {t('Points')}
                    </th>
                    <th scope="col" className="hidden px-4 py-2 font-bold sm:table-cell">
                      {t('Ce qu’il mesure')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CRITERIA.map((item) => (
                    <tr key={item.label} className="border-b border-ink-200 last:border-0">
                      <th scope="row" className="px-4 py-2.5 font-bold text-ink-900">
                        {t(item.label)}
                      </th>
                      <td className="px-4 py-2.5 text-right font-mono text-ink-700">
                        {item.weight}
                      </td>
                      <td className="hidden px-4 py-2.5 text-ink-600 sm:table-cell">
                        {t(item.text)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-ink-200 bg-ink-100">
                  <tr>
                    <th scope="row" className="px-4 py-2 font-bold">
                      {t('Total')}
                    </th>
                    <td className="px-4 py-2 text-right font-mono font-bold">100</td>
                    <td className="hidden sm:table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ——— Ce qui nous distingue ——— */}
      <Distinctives isAuthenticated={isAuthenticated} />

      {/* ——— Formes d'échange ——— */}
      <section aria-labelledby="echanges" className="border-y border-ink-200 bg-[#f7f7f7] py-14">
        <PageContainer>
          <SectionTitle
            id="echanges"
            title={t('Quatre façons de travailler ensemble')}
            text={t(
              'Choisissez la forme qui vous convient. Vous pouvez en essayer plusieurs avec la même personne.',
            )}
          />
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {EXCHANGE_KINDS.map((kind) => (
              <li key={kind.label}>
                <Icon name={kind.icon} size={28} className="mb-2 text-accent-500" />
                <h3 className="text-base font-bold">{t(kind.label)}</h3>
                <p className="mt-1 text-ink-600">{t(kind.text)}</p>
              </li>
            ))}
          </ul>
        </PageContainer>
      </section>

      {/* ——— Nos principes ——— */}
      <section aria-labelledby="principes" className="py-14">
        <PageContainer>
          <SectionTitle
            id="principes"
            title={t('Pensé pour que les deux côtés y gagnent')}
            text={t(
              'DevLink Africa n’est pas un annuaire : c’est un outil pour trouver la bonne personne avec qui progresser.',
            )}
          />
          <ul className="grid gap-8 md:grid-cols-3">
            {PRINCIPLES.map((item) => (
              <li key={item.title} className="flex gap-3">
                <Icon name={item.icon} size={24} className="mt-0.5 shrink-0 text-ink-400" />
                <div>
                  <h3 className="text-base font-bold">{t(item.title)}</h3>
                  <p className="mt-1 text-ink-600">{t(item.text)}</p>
                </div>
              </li>
            ))}
          </ul>
        </PageContainer>
      </section>

      {/* ——— Appel final ——— */}
      <section aria-labelledby="final" className="bg-[#2a6496] text-white">
        <PageContainer className="flex flex-col items-start justify-between gap-5 py-10 md:flex-row md:items-center">
          <div>
            <h2 id="final" className="text-2xl font-bold text-white">
              {t('Votre prochain binôme')} {t('vous attend peut-être déjà')}.
            </h2>
            <p className="mt-1 text-[#dce9f5]">
              {t(
                'Créez votre profil, ajoutez vos compétences, et découvrez qui peut vous apprendre ce qui vous manque.',
              )}
            </p>
          </div>
          <Link to={isAuthenticated ? '/matchs' : '/inscription'} className="btn btn-lg shrink-0">
            {isAuthenticated ? t('Voir mes matchs') : t('Créer mon compte')}
          </Link>
        </PageContainer>
      </section>
    </div>
  )
}
