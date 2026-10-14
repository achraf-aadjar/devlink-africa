import { cn } from '../lib/cn'
import { useI18n } from '../i18n/useI18n'

const SIZES = {
  sm: { box: 'h-9 min-w-11 px-1.5', value: 'text-xl', max: 'text-[0.6875rem]' },
  md: { box: 'h-12 min-w-14 px-2', value: 'text-[1.75rem]', max: 'text-xs' },
  lg: { box: 'h-24 min-w-28 px-4', value: 'text-6xl', max: 'text-sm' },
} as const

/**
 * Score de 0 à 100 sur une plaque noire, comme le tableau d'affichage d'un
 * stade : un chiffre, pas une jauge décorative.
 *
 * Le chiffre reste un texte normal, lisible et sélectionnable ; les lecteurs
 * d'écran lisent l'étiquette de la figure.
 */
export default function ScorePlate({
  score,
  size = 'md',
  showMax = false,
  precise = false,
  quiet = false,
  className,
}: {
  score: number
  size?: keyof typeof SIZES
  /** Affiche « /100 » à côté du chiffre. */
  showMax?: boolean
  /** Garde une décimale (82,5) quand un détail des points est affiché à côté. */
  precise?: boolean
  /** Plaque en creux (filet seul) : pour les scores bas d'un classement. */
  quiet?: boolean
  className?: string
}) {
  const { t, lang } = useI18n()
  const bounded = Math.min(Math.max(score, 0), 100)
  const value = precise
    ? bounded.toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 1 })
    : Math.round(bounded)
  const style = SIZES[size]

  return (
    <div
      role="img"
      aria-label={t('Score de {value} sur 100', { value })}
      className={cn(
        'inline-flex shrink-0 items-baseline justify-center gap-1 rounded font-display font-bold leading-none ring-1 ring-inset',
        quiet ? 'bg-transparent text-ink-800 ring-ink-400' : 'bg-bar text-bar-text ring-bar-line',
        'pt-[0.2em]',
        style.box,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('self-center tabular-nums', style.value)}>
        {value}
      </span>
      {showMax && (
        <span
          aria-hidden="true"
          className={cn('self-center', quiet ? 'text-ink-600' : 'text-bar-muted', style.max)}
        >
          /100
        </span>
      )}
    </div>
  )
}
