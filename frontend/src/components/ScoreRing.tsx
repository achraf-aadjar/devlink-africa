import { useId } from 'react'
import { cn } from '../lib/cn'
import { useI18n } from '../i18n/useI18n'

/**
 * Score de 0 à 100 dessiné comme une jauge circulaire, en dégradé bleu-violet.
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
  const gradientId = useId()
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
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent-800))" />
            <stop offset="55%" stopColor="#388bfd" />
            <stop offset="100%" stopColor="#a371f7" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--veil) / 0.1)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
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
