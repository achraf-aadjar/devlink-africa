import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../../components/icons/Icon'
import Avatar from '../../../components/Avatar'
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { EXCHANGE_STATUS_LABELS, EXCHANGE_TYPE_LABELS } from '../../../lib/labels'
import type { Exchange, ExchangeStatus } from '../../../lib/types'
import { useQuery } from '../../../lib/useQuery'
import { useAuth } from '../../auth/hooks/useAuth'
import { cn } from '../../../lib/cn'
import { changeExchangeStatus, listExchanges } from '../api/exchanges'
import { getEndorsementCandidates } from '../../endorsements/api/endorsements'
import EndorsePanel from '../../endorsements/components/EndorsePanel'
import ContactPanel from '../components/ContactPanel'
import { EXCHANGES_CHANGED, usePendingRequests } from '../hooks/usePendingRequests'

type Tab = 'received' | 'sent'

/** Les trois temps d'un échange qui aboutit. */
const PHASES: ExchangeStatus[] = ['PROPOSED', 'ACCEPTED', 'COMPLETED']

/**
 * Où en est l'échange : trois phases nommées, la phase atteinte cochée. Le
 * texte et le pictogramme portent l'information, jamais la couleur seule. Un
 * échange refusé ou annulé le dit en toutes lettres.
 */
function ExchangePhases({ status }: { status: ExchangeStatus }) {
  const { t } = useI18n()
  if (status === 'DECLINED' || status === 'CANCELLED') {
    return (
      <p className="text-sm text-ink-600">
        {status === 'DECLINED' ? t('Échange refusé : il est clos.') : t('Demande annulée.')}
      </p>
    )
  }
  const reached = PHASES.indexOf(status)
  return (
    <ol
      aria-label={t("Étapes de l'échange")}
      className="flex flex-wrap items-center gap-x-2 gap-y-1"
    >
      {PHASES.map((phase, index) => {
        const done = index <= reached
        return (
          <li key={phase} className="flex items-center gap-2">
            {index > 0 && (
              <span
                aria-hidden="true"
                className={cn('h-0.5 w-6 rounded', done ? 'bg-ink-900' : 'bg-ink-300')}
              />
            )}
            <span
              aria-current={index === reached ? 'step' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 text-sm',
                done ? 'font-semibold text-ink-900' : 'text-ink-500',
              )}
            >
              {done ? (
                <Icon name="check" size={16} className="text-success" />
              ) : (
                <span aria-hidden="true" className="h-3 w-3 rounded-full border-2 border-ink-400" />
              )}
              {t(EXCHANGE_STATUS_LABELS[phase])}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export default function ExchangesPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('received')
  const { data, loading, error, reload } = useQuery(() => listExchanges({ direction: tab }), [tab])
  const [actionError, setActionError] = useState<string | null>(null)
  const pending = usePendingRequests(true)
  const candidates = useQuery(() => getEndorsementCandidates(), [])
  const candidateFor = (userId: number) =>
    candidates.data?.results.find((candidate) => candidate.user.id === userId)

  async function act(exchange: Exchange, status: ExchangeStatus) {
    setActionError(null)
    try {
      await changeExchangeStatus(exchange.id, status)
      reload()
      window.dispatchEvent(new Event(EXCHANGES_CHANGED))
    } catch {
      setActionError(t("L'action n'a pas pu être effectuée."))
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="page-title">{t('Mes échanges')}</h1>
        <p className="mt-1 text-sm text-ink-600">
          {t('Les demandes que vous avez reçues et celles que vous avez envoyées.')}
        </p>
      </header>

      <div
        role="tablist"
        aria-label={t('Direction des échanges')}
        className="flex gap-1 border-b border-ink-300"
      >
        {(['received', 'sent'] as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              '-mb-px flex min-h-11 items-center gap-2 border-b-[3px] px-4 font-display text-lg font-bold uppercase tracking-[0.02em] transition-colors',
              tab === value
                ? 'border-brand text-ink-900'
                : 'border-transparent text-ink-600 hover:text-ink-900',
            )}
          >
            {value === 'received' ? t('Reçues') : t('Envoyées')}
            {value === 'received' && pending > 0 && (
              <span className="rounded bg-demand-fill px-1.5 font-display text-sm leading-5 text-white tabular-nums">
                <span aria-hidden="true">{pending}</span>
                <span className="sr-only">{` (${t('{n} en attente', { n: pending })})`}</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-card bg-danger/10 px-5 py-3 text-sm text-danger ring-1 ring-inset ring-danger/25"
        >
          {actionError}
        </p>
      )}

      {loading && <LoadingState rows={2} label={t('Chargement de vos échanges…')} />}
      {error && <ErrorState onRetry={reload} />}

      {data && data.results.length === 0 && (
        <EmptyState
          title={tab === 'received' ? t('Aucune demande reçue') : t('Aucune demande envoyée')}
          description={
            tab === 'received'
              ? t(
                  "Personne ne vous a encore proposé d'échange. Complétez vos compétences pour être plus visible.",
                )
              : t("Parcourez vos matchs et proposez un échange à quelqu'un de complémentaire.")
          }
          action={
            <ButtonLink to="/matchs" size="sm">
              {t('Voir mes matchs')}
            </ButtonLink>
          }
        />
      )}

      {data && data.results.length > 0 && (
        <ul className="flex flex-col gap-4">
          {data.results.map((exchange) => {
            const isRecipient = user?.id === exchange.partner.id
            const other = isRecipient ? exchange.requester : exchange.partner
            const me = isRecipient ? exchange.partner : exchange.requester
            const unlocked = exchange.status === 'ACCEPTED' || exchange.status === 'COMPLETED'
            const candidate = candidateFor(other.id)

            return (
              <Card as="li" key={exchange.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-3 font-semibold text-ink-900">
                    <Avatar name={other.full_name || t('Développeur')} size={40} />
                    <span>
                      {t('{type} avec', { type: t(EXCHANGE_TYPE_LABELS[exchange.type]) })}{' '}
                      <Link to={`/developpeurs/${other.id}`} className="hover:underline">
                        {other.full_name}
                      </Link>
                    </span>
                  </h2>
                </div>

                <ExchangePhases status={exchange.status} />

                <p className="whitespace-pre-line text-sm text-ink-700">{exchange.message}</p>

                {exchange.skill && (
                  <p className="text-sm text-ink-600">
                    {t('Compétence : {skill}', { skill: exchange.skill.name })}
                  </p>
                )}

                {unlocked && <ContactPanel other={other} me={me} />}

                {exchange.status === 'COMPLETED' && candidate && (
                  <EndorsePanel candidate={candidate} onChange={candidates.reload} />
                )}

                <div className="flex flex-wrap gap-2">
                  {exchange.status === 'PROPOSED' && isRecipient && (
                    <>
                      <Button size="sm" onClick={() => act(exchange, 'ACCEPTED')}>
                        {t('Accepter')}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => act(exchange, 'DECLINED')}
                      >
                        {t('Refuser')}
                      </Button>
                    </>
                  )}
                  {exchange.status === 'PROPOSED' && !isRecipient && (
                    <Button size="sm" variant="ghost" onClick={() => act(exchange, 'CANCELLED')}>
                      {t('Annuler ma demande')}
                    </Button>
                  )}
                  {exchange.status === 'ACCEPTED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => act(exchange, 'COMPLETED')}
                    >
                      {t('Marquer comme terminé')}
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </ul>
      )}
    </section>
  )
}
