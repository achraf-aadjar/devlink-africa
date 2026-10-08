import { Link } from 'react-router-dom'
import Icon from '../../../components/icons/Icon'
import { cn } from '../../../lib/cn'
import type { Dashboard } from '../../../lib/types'

interface Step {
  done: boolean
  title: string
  text: string
  to: string
  action: string
}

/** Les cinq étapes qui mènent d'un compte vide à un premier échange. */
function onboardingSteps(data: Dashboard): Step[] {
  return [
    {
      done: data.profile_completeness === 100,
      title: 'Compléter votre profil',
      text:
        data.profile_completeness === 100
          ? 'Profil complet.'
          : `Votre profil est complété à ${data.profile_completeness} %. Un profil complet reçoit des propositions plus justes.`,
      to: '/profil',
      action: 'Compléter mon profil',
    },
    {
      done: data.counters.offered_skills > 0,
      title: 'Dire ce que vous savez faire',
      text: 'Dev Match cherche des personnes qui veulent apprendre ce que vous maîtrisez.',
      to: '/competences',
      action: 'Ajouter une compétence',
    },
    {
      done: data.counters.wanted_skills > 0,
      title: 'Dire ce que vous voulez apprendre',
      text: "C'est l'autre moitié de l'échange : sans elle, aucun match réciproque.",
      to: '/competences',
      action: 'Ajouter une envie',
    },
    {
      done: data.has_contact,
      title: 'Indiquer un moyen de contact',
      text: 'Il ne sera montré qu’à vos partenaires, une fois un échange accepté.',
      to: '/profil',
      action: 'Ajouter mon contact',
    },
    {
      done: data.counters.exchanges > 0,
      title: 'Proposer votre premier échange',
      text: 'Choisissez un match et proposez du mentorat, une revue de code ou un projet commun.',
      to: '/matchs',
      action: 'Voir mes matchs',
    },
  ]
}

/**
 * Premiers pas : une liste courte qui dit quoi faire ensuite, au lieu de
 * laisser un nouveau compte devant un tableau de bord vide. Elle disparaît une
 * fois tout fait. Seule la prochaine étape porte un bouton, pour qu'il n'y ait
 * jamais de doute sur l'action à mener.
 */
export default function OnboardingChecklist({ data }: { data: Dashboard }) {
  const steps = onboardingSteps(data)
  const doneCount = steps.filter((step) => step.done).length
  if (doneCount === steps.length) return null
  const nextIndex = steps.findIndex((step) => !step.done)

  return (
    <section
      aria-labelledby="premiers-pas"
      className="surface relative overflow-hidden p-6 shadow-glow-soft sm:p-8"
    >
      <div aria-hidden="true" className="glow-blob -right-20 -top-24 h-64 w-64 bg-[#1f6feb]/25" />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="premiers-pas" className="text-xl font-semibold text-ink-900">
            Vos premiers pas
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            {doneCount} étape{doneCount > 1 ? 's' : ''} faite{doneCount > 1 ? 's' : ''} sur{' '}
            {steps.length}
          </p>
        </div>
        <div
          aria-hidden="true"
          className="h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-white/[0.08]"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1f6feb] to-[#a371f7] transition-[width] duration-500"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ol className="relative mt-6 flex flex-col gap-1">
        {steps.map((step, index) => {
          const isNext = index === nextIndex
          return (
            <li
              key={step.title}
              className={cn(
                'flex items-start gap-4 rounded-2xl px-3 py-3',
                isNext && 'bg-white/[0.04] ring-1 ring-inset ring-accent-400/25',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  step.done
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : isNext
                      ? 'bg-[#1f6feb] text-white shadow-glow'
                      : 'bg-white/[0.06] text-ink-500',
                )}
              >
                {step.done ? <Icon name="check" size={16} label="Fait" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'font-medium',
                    step.done ? 'text-ink-500 line-through decoration-ink-400' : 'text-ink-900',
                  )}
                >
                  {step.title}
                </p>
                {!step.done && <p className="mt-0.5 text-sm text-ink-600">{step.text}</p>}
              </div>
              {isNext && (
                <Link
                  to={step.to}
                  className="shrink-0 self-center rounded-full bg-[#1f6feb] px-4 py-1.5 text-sm font-medium text-white shadow-glow transition hover:bg-[#1a5fd0]"
                >
                  {step.action}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
