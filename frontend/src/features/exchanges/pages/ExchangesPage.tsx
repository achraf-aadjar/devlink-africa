import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState } from '../../../components/ui'
import { EXCHANGE_STATUS_LABELS, EXCHANGE_TYPE_LABELS } from '../../../lib/labels'
import type { Exchange, ExchangeStatus } from '../../../lib/types'
import { useQuery } from '../../../lib/useQuery'
import { useAuth } from '../../auth/hooks/useAuth'
import { changeExchangeStatus, listExchanges } from '../api/exchanges'

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

  async function act(exchange: Exchange, status: ExchangeStatus) {
    setActionError(null)
    try {
      await changeExchangeStatus(exchange.id, status)
      reload()
    } catch {
      setActionError("L'action n'a pas pu être effectuée.")
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-ink-900">Mes échanges</h1>
        <p className="mt-1 text-sm text-ink-600">
          Les demandes que vous avez reçues et celles que vous avez envoyées.
        </p>
      </header>

      <div role="tablist" aria-label="Direction des échanges" className="flex gap-2">
        {(['received', 'sent'] as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === value
                ? 'bg-accent-400 text-white'
                : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}
          >
            {value === 'received' ? 'Reçues' : 'Envoyées'}
          </button>
        ))}
      </div>

      {actionError && (
        <p role="alert" className="rounded-lg bg-red-950/50 px-4 py-3 text-sm text-red-300">
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

            return (
              <Card as="li" key={exchange.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold text-ink-900">
                    {EXCHANGE_TYPE_LABELS[exchange.type]} avec{' '}
                    <Link to={`/developpeurs/${other.id}`} className="hover:underline">
                      {other.full_name}
                    </Link>
                  </h2>
                  <Badge tone={STATUS_TONE[exchange.status]}>
                    {EXCHANGE_STATUS_LABELS[exchange.status]}
                  </Badge>
                </div>

                <p className="whitespace-pre-line text-sm text-ink-700">{exchange.message}</p>

                {exchange.skill && (
                  <p className="text-sm text-ink-600">Compétence : {exchange.skill.name}</p>
                )}

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
