import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState } from '../../../components/ui'
import { EXCHANGE_STATUS_LABELS, EXCHANGE_TYPE_LABELS } from '../../../lib/labels'
import type { Exchange, ExchangeStatus } from '../../../lib/types'
import { useQuery } from '../../../lib/useQuery'
import { useAuth } from '../../auth/hooks/useAuth'
import { cn } from '../../../lib/cn'
import { changeExchangeStatus, listExchanges } from '../api/exchanges'
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
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('received')
  const { data, loading, error, reload } = useQuery(() => listExchanges({ direction: tab }), [tab])
  const [actionError, setActionError] = useState<string | null>(null)
  const pending = usePendingRequests(true)

  async function act(exchange: Exchange, status: ExchangeStatus) {
    setActionError(null)
    try {
      await changeExchangeStatus(exchange.id, status)
      reload()
      window.dispatchEvent(new Event(EXCHANGES_CHANGED))
    } catch {
      setActionError("L'action n'a pas pu être effectuée.")
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">Mes échanges</h1>
        <p className="mt-1 text-sm text-ink-600">
          Les demandes que vous avez reçues et celles que vous avez envoyées.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Direction des échanges"
        className="flex w-fit gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]"
      >
        {(['received', 'sent'] as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              'flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition',
              tab === value
                ? 'bg-[#1f6feb] text-white shadow-glow'
                : 'text-ink-700 hover:bg-white/[0.06] hover:text-ink-900',
            )}
          >
            {value === 'received' ? 'Reçues' : 'Envoyées'}
            {value === 'received' && pending > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs tabular-nums">
                <span aria-hidden="true">{pending}</span>
                <span className="sr-only">{` (${pending} en attente)`}</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {actionError && (
        <p role="alert" className="rounded-2xl bg-red-950/50 px-5 py-3 text-sm text-red-300">
          {actionError}
        </p>
      )}

      {loading && <LoadingState rows={2} label="Chargement de vos échanges…" />}
      {error && <ErrorState onRetry={reload} />}

      {data && data.results.length === 0 && (
        <EmptyState
          title={tab === 'received' ? 'Aucune demande reçue' : 'Aucune demande envoyée'}
          description={
            tab === 'received'
              ? "Personne ne vous a encore proposé d'échange. Complétez vos compétences pour être plus visible."
              : "Parcourez vos matchs et proposez un échange à quelqu'un de complémentaire."
          }
          action={
            <Link to="/matchs">
              <Button size="sm">Voir mes matchs</Button>
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

            return (
              <Card as="li" key={exchange.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-3 font-semibold text-ink-900">
                    <Avatar name={other.full_name || 'Développeur'} size={40} />
                    <span>
                      {EXCHANGE_TYPE_LABELS[exchange.type]} avec{' '}
                      <Link to={`/developpeurs/${other.id}`} className="hover:underline">
                        {other.full_name}
                      </Link>
                    </span>
                  </h2>
                  <Badge tone={STATUS_TONE[exchange.status]}>
                    {EXCHANGE_STATUS_LABELS[exchange.status]}
                  </Badge>
                </div>

                <p className="whitespace-pre-line text-sm text-ink-700">{exchange.message}</p>

                {exchange.skill && (
                  <p className="text-sm text-ink-600">Compétence : {exchange.skill.name}</p>
                )}

                {unlocked && <ContactPanel other={other} me={me} />}

                <div className="flex flex-wrap gap-2">
                  {exchange.status === 'PROPOSED' && isRecipient && (
                    <>
                      <Button size="sm" onClick={() => act(exchange, 'ACCEPTED')}>
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => act(exchange, 'DECLINED')}
                      >
                        Refuser
                      </Button>
                    </>
                  )}
                  {exchange.status === 'PROPOSED' && !isRecipient && (
                    <Button size="sm" variant="ghost" onClick={() => act(exchange, 'CANCELLED')}>
                      Annuler ma demande
                    </Button>
                  )}
                  {exchange.status === 'ACCEPTED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => act(exchange, 'COMPLETED')}
                    >
                      Marquer comme terminé
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
