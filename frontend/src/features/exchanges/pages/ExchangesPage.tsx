import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState } from '../../../components/ui'
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

const STATUS_TONE: Record<ExchangeStatus, 'warning' | 'success' | 'neutral'> = {
  PROPOSED: 'warning',
  ACCEPTED: 'success',
  COMPLETED: 'success',
  DECLINED: 'neutral',
  CANCELLED: 'neutral',
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
      <header className="page-header">
        <h1 className="text-[26px] font-bold leading-tight text-ink-900">{t('Mes échanges')}</h1>
        <p className="mt-1 text-sm text-ink-600">
          {t('Les demandes que vous avez reçues et celles que vous avez envoyées.')}
        </p>
      </header>

      <div
        role="tablist"
        aria-label={t('Direction des échanges')}
        className="flex border-b border-ink-300"
      >
        {(['received', 'sent'] as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              '-mb-px flex items-center gap-2 rounded-t border px-4 py-2 text-sm',
              tab === value
                ? 'border-ink-300 border-b-white bg-white font-bold text-ink-900'
                : 'border-transparent text-accent-700 hover:border-ink-200 hover:bg-ink-100',
            )}
          >
            {value === 'received' ? t('Reçues') : t('Envoyées')}
            {value === 'received' && pending > 0 && (
              <span className="rounded-[10px] bg-ink-200 px-1.5 text-xs font-bold text-ink-700">
                <span aria-hidden="true">{pending}</span>
                <span className="sr-only">{` (${t('{n} en attente', { n: pending })})`}</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {actionError && (
        <p role="alert" className="alert alert-danger">
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
            <Link to="/matchs">
              <Button size="sm">{t('Voir mes matchs')}</Button>
            </Link>
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
                  <Badge tone={STATUS_TONE[exchange.status]}>
                    {t(EXCHANGE_STATUS_LABELS[exchange.status])}
                  </Badge>
                </div>

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
