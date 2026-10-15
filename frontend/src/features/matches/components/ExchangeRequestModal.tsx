import { useState } from 'react'
import Icon from '../../../components/icons/Icon'
import { Badge, Button, ButtonLink, Modal, Select, Textarea } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import { EXCHANGE_TYPE_LABELS } from '../../../lib/labels'
import type { ExchangeType } from '../../../lib/types'
import { requestExchange } from '../api/matches'

const TYPE_OPTIONS = Object.entries(EXCHANGE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

/** Ligne du récapitulatif : ce qui part ou ce qui arrive, en étiquettes. */
function RecapLine({
  label,
  skills,
  tone,
}: {
  label: string
  skills: string[]
  tone: 'offered' | 'wanted'
}) {
  if (skills.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <dt className="w-32 shrink-0 text-sm text-ink-600">{label}</dt>
      <dd className="flex flex-wrap gap-1.5">
        {skills.map((name) => (
          <Badge key={name} tone={tone}>
            {name}
          </Badge>
        ))}
      </dd>
    </div>
  )
}

/**
 * Fenêtre de proposition d'échange depuis un match (DL-23).
 *
 * Le moment le plus engageant du parcours : on rappelle ce que chacun donne
 * et reçoit, on dit clairement que les contacts restent cachés jusqu'à
 * l'accord, et on confirme l'envoi dans la fenêtre avant de la fermer.
 */
export default function ExchangeRequestModal({
  matchId,
  partnerName,
  open,
  onClose,
  onSent,
  give = [],
  receive = [],
}: {
  matchId: number
  partnerName: string
  open: boolean
  onClose: () => void
  onSent: () => void
  /** Compétences que vous pouvez lui apprendre. */
  give?: string[]
  /** Compétences qu'il ou elle peut vous apprendre. */
  receive?: string[]
}) {
  const { t } = useI18n()
  const [type, setType] = useState<ExchangeType>('MENTORAT')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{ message?: string; form?: string }>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function handleClose() {
    setSent(false)
    onClose()
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!message.trim()) {
      setErrors({ message: t('Écrivez un mot pour vous présenter.') })
      return
    }

    setSending(true)
    setErrors({})
    try {
      await requestExchange(matchId, { type, message: message.trim() })
      setMessage('')
      setSent(true)
      onSent()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          message: error.fieldError('message'),
          form:
            error.code === 'duplicate_request'
              ? t('Une demande est déjà en attente avec cette personne.')
              : error.fieldError('message')
                ? undefined
                : error.message,
        })
      } else {
        setErrors({ form: t('Impossible de contacter le serveur. Réessayez.') })
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      open={open}
      title={t('Proposer un échange à {name}', { name: partnerName })}
      onClose={handleClose}
    >
      {sent ? (
        <div className="flex flex-col gap-4">
          <p
            role="status"
            className="flex items-start gap-3 rounded-card bg-success/10 p-4 text-sm text-ink-900 ring-1 ring-inset ring-success/25"
          >
            <Icon name="check" size={20} className="shrink-0 text-success" />
            <span>
              <strong className="block font-semibold">
                {t('Demande envoyée à {name}.', { name: partnerName })}
              </strong>
              {t(
                "Sa réponse apparaîtra dans vos échanges. S'il y a accord, vos moyens de contact s'afficheront des deux côtés.",
              )}
            </span>
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              {t('Rester sur ce match')}
            </Button>
            <ButtonLink to="/echanges">{t('Voir mes échanges')}</ButtonLink>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {(give.length > 0 || receive.length > 0) && (
            <dl className="flex flex-col gap-2 rounded-card bg-ink-50 p-3 ring-1 ring-inset ring-veil/[0.1]">
              <RecapLine label={t('Vous recevez')} skills={receive} tone="wanted" />
              <RecapLine label={t('Vous donnez')} skills={give} tone="offered" />
            </dl>
          )}
          <Select
            label={t("Type d'échange")}
            value={type}
            options={TYPE_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
            onChange={(event) => setType(event.target.value as ExchangeType)}
          />
          <Textarea
            label={t('Votre message')}
            required
            value={message}
            error={errors.message}
            hint={t('Dites ce que vous cherchez et ce que vous pouvez apporter.')}
            maxLength={1000}
            onChange={(event) => setMessage(event.target.value)}
          />

          <p className="flex gap-2 text-sm text-ink-600">
            <Icon name="info" size={18} className="mt-px shrink-0 text-ink-500" />
            {t("Vos moyens de contact restent cachés : ils ne s'affichent que si {name} accepte.", {
              name: partnerName,
            })}
          </p>

          {errors.form && (
            <p role="alert" className="text-sm text-danger">
              {errors.form}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              {t('Annuler')}
            </Button>
            <Button type="submit" loading={sending}>
              {t('Envoyer la demande')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
