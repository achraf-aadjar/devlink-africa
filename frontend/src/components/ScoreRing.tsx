import { cn } from '../lib/cn'
import { useI18n } from '../i18n/useI18n'

/**
 * Score de 0 à 100 dessiné comme une jauge circulaire, d'une seule couleur :
 * vert à partir de 70, bleu en dessous.
 *
 * Le chiffre reste un texte normal au centre : lisible, sélectionnable, et lu
 * par les lecteurs d'écran via l'étiquette de la figure.
 */
export default function ScoreRing({
  score,
  size = 64,
  stroke = 6,
  className,
  showMax = false,
}: {
  score: number
  size?: number
  stroke?: number
  className?: string
  /** Affiche « /100 » sous le chiffre (grandes tailles seulement). */
  showMax?: boolean
}) {
  const { t } = useI18n()
  const value = Math.round(Math.min(Math.max(score, 0), 100))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div
      role="img"
      aria-label={t('Score de {value} sur 100', { value })}
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e5e5"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={value >= 70 ? '#3c763d' : '#337ab7'}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <span aria-hidden="true" className="absolute flex flex-col items-center leading-none">
        <span
          className="font-bold tabular-nums text-ink-900"
          style={{ fontSize: Math.round(size * 0.3) }}
        >
          {value}
        </span>
        {showMax && <span className="mt-1 text-xs text-ink-500">/ 100</span>}
      </span>
    </div>
  )
}
