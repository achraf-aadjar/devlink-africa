import { useState } from 'react'
import { Button, Modal, Select, Textarea } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import { EXCHANGE_TYPE_LABELS } from '../../../lib/labels'
import type { ExchangeType } from '../../../lib/types'
import { requestExchange } from '../api/matches'

const TYPE_OPTIONS = Object.entries(EXCHANGE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

/** Fenêtre de proposition d'échange depuis un match (DL-23). */
export default function ExchangeRequestModal({
  matchId,
  partnerName,
  open,
  onClose,
  onSent,
}: {
  matchId: number
  partnerName: string
  open: boolean
  onClose: () => void
  onSent: () => void
}) {
  const { t } = useI18n()
  const [type, setType] = useState<ExchangeType>('MENTORAT')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{ message?: string; form?: string }>({})
  const [sending, setSending] = useState(false)

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
      onSent()
      onClose()
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
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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

        {errors.form && (
          <p role="alert" className="text-sm text-[#a94442]">
            {errors.form}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Annuler')}
          </Button>
          <Button type="submit" loading={sending}>
            {t('Envoyer la demande')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
