import { Link } from 'react-router-dom'
import Icon from '../../../components/icons/Icon'
import type { I18n } from '../../../i18n/context'
import { useI18n } from '../../../i18n/useI18n'
import { cn } from '../../../lib/cn'
import { buttonClasses } from '../../../components/ui/buttonStyles'
import type { Dashboard } from '../../../lib/types'

interface Step {
  done: boolean
  title: string
  text: string
  to: string
  action: string
}

/** Les cinq étapes qui mènent d'un compte vide à un premier échange. */
function onboardingSteps(data: Dashboard, t: I18n['t']): Step[] {
  return [
    {
      done: data.profile_completeness === 100,
      title: t('Compléter votre profil'),
      text:
        data.profile_completeness === 100
          ? t('Profil complet.')
          : t(
              'Votre profil est complété à {percent} %. Un profil complet reçoit des propositions plus justes.',
              { percent: data.profile_completeness },
            ),
      to: '/profil',
      action: t('Compléter mon profil'),
    },
    {
      done: data.counters.offered_skills > 0,
      title: t('Dire ce que vous savez faire'),
      text: t('Dev Match cherche des personnes qui veulent apprendre ce que vous maîtrisez.'),
      to: '/competences',
      action: t('Ajouter une compétence'),
    },
    {
      done: data.counters.wanted_skills > 0,
      title: t('Dire ce que vous voulez apprendre'),
      text: t("C'est l'autre moitié de l'échange : sans elle, aucun match réciproque."),
      to: '/competences',
      action: t('Ajouter une envie'),
    },
    {
      done: data.has_contact,
      title: t('Indiquer un moyen de contact'),
      text: t('Il ne sera montré qu’à vos partenaires, une fois un échange accepté.'),
      to: '/profil',
      action: t('Ajouter mon contact'),
    },
    {
      done: data.counters.exchanges > 0,
      title: t('Proposer votre premier échange'),
      text: t(
        'Choisissez un match et proposez du mentorat, une revue de code ou un projet commun.',
      ),
      to: '/matchs',
      action: t('Voir mes matchs'),
    },
  ]
}

/**
 * Premiers pas : une liste courte qui dit quoi faire ensuite, au lieu de
 * laisser un nouveau compte devant un tableau de bord vide. Elle disparaît une
 * fois tout fait. Seule la prochaine étape est ouverte et porte un bouton ;
 * les étapes faites se replient, pour ne pas occuper l'écran.
 */
export default function OnboardingChecklist({ data }: { data: Dashboard }) {
  const { t, tn } = useI18n()
  const steps = onboardingSteps(data, t)
  const doneCount = steps.filter((step) => step.done).length
  if (doneCount === steps.length) return null
  const nextIndex = steps.findIndex((step) => !step.done)
  const next = steps[nextIndex]
  const done = steps.filter((step) => step.done)
  const later = steps.filter((step, index) => !step.done && index !== nextIndex)

  return (
    <section aria-labelledby="premiers-pas" className="surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <h2 id="premiers-pas" className="sheet-title">
          {t('Vos premiers pas')}
        </h2>
        <div className="flex items-center gap-3">
          <p className="text-sm text-ink-600">
            {tn(doneCount, '{n} étape faite sur {total}', '{n} étapes faites sur {total}', {
              total: steps.length,
            })}
          </p>
          {/* Une case par étape, comme une grille de feuille de match. */}
          <ol aria-hidden="true" className="flex gap-1">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className={cn(
                  'h-2 w-6 rounded-sm',
                  step.done ? 'bg-success' : index === nextIndex ? 'bg-brand' : 'bg-ink-200',
                )}
              />
            ))}
          </ol>
        </div>
      </div>

      {/* La prochaine étape : une bande pleine largeur dans la feuille, pas une carte de plus. */}
      <div className="-mx-5 mt-4 flex flex-col gap-4 border-y border-accent-600/20 bg-accent-50 px-5 py-4 sm:-mx-6 sm:flex-row sm:items-center sm:px-6">
        <span
          aria-hidden="true"
          className="font-display text-[2.5rem] font-bold leading-none text-accent-700 tabular-nums"
        >
          {nextIndex + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-900">{next.title}</p>
          <p className="mt-0.5 text-sm text-ink-700">{next.text}</p>
        </div>
        <Link
          to={next.to}
          className={buttonClasses('primary', 'md', 'shrink-0 self-start sm:self-center')}
        >
          {next.action}
        </Link>
      </div>

      {(done.length > 0 || later.length > 0) && (
        <div className="mt-3 flex flex-col gap-1 text-sm text-ink-600 sm:flex-row sm:flex-wrap sm:gap-x-6">
          {done.map((step) => (
            <span key={step.title} className="inline-flex items-center gap-1.5">
              <Icon name="check" size={16} className="text-success" label={t('Fait')} />
              {step.title}
            </span>
          ))}
          {later.map((step) => (
            <span key={step.title} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 rounded-full border-2 border-ink-400"
              />
              {step.title}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
