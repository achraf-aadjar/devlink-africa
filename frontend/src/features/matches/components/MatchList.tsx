import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import DemoBadge from '../../../components/DemoBadge'
import ScorePlate from '../../../components/ScorePlate'
import Icon from '../../../components/icons/Icon'
import { Badge } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { countryFlag } from '../../../lib/labels'
import { cn } from '../../../lib/cn'
import type { MatchSummary } from '../../../lib/types'

/**
 * Colonnes fixes de la feuille : elles ne bougent jamais, seules les lignes
 * changent. Sous 50 points, la plaque passe en creux : le haut du classement
 * se lit d'un coup d'œil.
 */
const COLUMNS = 'lg:grid-cols-[4rem_minmax(12rem,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem]'

function Skills({ names, tone }: { names?: string[]; tone: 'offered' | 'wanted' }) {
  if (!names || names.length === 0) return <span className="text-sm text-ink-500">—</span>
  return (
    <ul className="flex flex-wrap gap-1.5">
      {names.map((name) => (
        <li key={name}>
          <Badge tone={tone}>{name}</Badge>
        </li>
      ))}
    </ul>
  )
}

function MatchRow({
  match,
  open,
  onToggle,
}: {
  match: MatchSummary
  open: boolean
  onToggle: () => void
}) {
  const { t } = useI18n()
  const panelId = useId()
  const name = match.user.full_name || t('Développeur')

  return (
    <li className={cn('border-b border-ink-200 last:border-0', open && 'bg-accent-50/50')}>
      <div
        className={cn(
          'grid grid-cols-[3rem_minmax(0,1fr)_2.75rem] items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-5',
          COLUMNS,
        )}
      >
        <ScorePlate score={match.score} size="sm" quiet={match.score < 50} />

        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={name} size={40} className="hidden sm:inline-flex" />
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-ink-900">
              <Link to={`/matchs/${match.id}`} className="hover:text-accent-700 hover:underline">
                {name}
              </Link>
            </h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ink-600">
              <span>
                {match.user.country && (
                  <span className="mr-1" aria-hidden="true">
                    {countryFlag(match.user.country)}
                  </span>
                )}
                {match.user.country || t('Pays non renseigné')}
              </span>
              <DemoBadge isDemo={match.user.is_demo} compact />
            </p>
          </div>
        </div>

        <div className="col-span-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3 lg:col-span-1 lg:block">
          <span className="w-28 shrink-0 text-xs font-medium text-ink-600 lg:sr-only">
            {t('Vous apprend')}
          </span>
          <Skills names={match.teaches_you} tone="wanted" />
        </div>
        <div className="col-span-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3 lg:col-span-1 lg:block">
          <span className="w-28 shrink-0 text-xs font-medium text-ink-600 lg:sr-only">
            {t('Vous lui apprenez')}
          </span>
          <Skills names={match.learns_from_you} tone="offered" />
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? t('Masquer les raisons') : t('Voir les raisons')}
          className="col-start-3 row-start-1 inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-600 hover:bg-ink-200 hover:text-ink-900 lg:col-start-auto lg:row-start-auto"
        >
          <Icon
            name="chevronDown"
            size={20}
            className={cn('transition-transform duration-150', open && 'rotate-180')}
          />
        </button>
      </div>

      {/* La fiche ouverte : une seule à la fois, comme la couverture tournée
          face au lecteur sur un présentoir. */}
      <div id={panelId} hidden={!open} className="px-4 pb-4 sm:px-5 lg:pl-[calc(4rem+2.25rem)]">
        {match.reasons.length > 0 && (
          <ul className="flex flex-col gap-1.5 text-sm text-ink-800">
            {match.reasons.map((reason) => (
              <li key={reason} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 h-0.5 w-3 shrink-0 rounded bg-ink-400" />
                {reason}
              </li>
            ))}
          </ul>
        )}
        <Link
          to={`/matchs/${match.id}`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent-700 underline-offset-4 hover:underline"
        >
          {t("Voir l'explication détaillée")}
          <Icon name="chevronRight" size={16} />
        </Link>
      </div>
    </li>
  )
}

/**
 * Les matchs comme une feuille de classement : score, personne, ce qu'elle
 * vous apprend, ce que vous lui apprenez. Une ligne s'ouvre à la fois pour
 * montrer les raisons ; la première est ouverte d'office.
 */
export default function MatchList({ matches }: { matches: MatchSummary[] }) {
  const { t } = useI18n()
  const [openId, setOpenId] = useState<number | null>(matches[0]?.id ?? null)

  return (
    <div className="surface overflow-hidden">
      <div
        aria-hidden="true"
        className={cn(
          'hidden border-b border-ink-300 px-5 py-2.5 font-display text-[0.9375rem] font-bold uppercase tracking-[0.02em] text-ink-700 lg:grid lg:gap-x-4',
          COLUMNS,
        )}
      >
        <span>{t('Score')}</span>
        <span>{t('Développeur')}</span>
        <span>{t('Vous apprend')}</span>
        <span>{t('Vous lui apprenez')}</span>
        <span />
      </div>
      <ul>
        {matches.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            open={openId === match.id}
            onToggle={() => setOpenId((current) => (current === match.id ? null : match.id))}
          />
        ))}
      </ul>
    </div>
  )
}
