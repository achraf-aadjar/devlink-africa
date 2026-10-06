import { useState } from 'react'
import { Button, Modal, Select, Textarea } from '../../../components/ui'
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
  const [type, setType] = useState<ExchangeType>('MENTORAT')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{ message?: string; form?: string }>({})
  const [sending, setSending] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!message.trim()) {
      setErrors({ message: 'Écrivez un mot pour vous présenter.' })
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
              ? 'Une demande est déjà en attente avec cette personne.'
              : error.fieldError('message')
                ? undefined
                : error.message,
        })
      } else {
        setErrors({ form: 'Impossible de contacter le serveur. Réessayez.' })
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open={open} title={`Proposer un échange à ${partnerName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Select
          label="Type d'échange"
          value={type}
          options={TYPE_OPTIONS}
          onChange={(event) => setType(event.target.value as ExchangeType)}
        />
        <Textarea
          label="Votre message"
          required
          value={message}
          error={errors.message}
          hint="Dites ce que vous cherchez et ce que vous pouvez apporter."
          maxLength={1000}
          onChange={(event) => setMessage(event.target.value)}
        />

        {errors.form && (
          <p role="alert" className="text-sm text-red-700">
            {errors.form}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={sending}>
            Envoyer la demande
          </Button>
        </div>
      </form>
    </Modal>
  )
}
