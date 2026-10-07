import { useState } from 'react'
import { Button, Modal, Select, Textarea } from '../../../components/ui'
import { ApiError } from '../../../lib/api'
import { REPORT_REASON_LABELS } from '../../../lib/labels'
import type { ReportReason, ReportTargetType } from '../../../lib/types'
import { sendReport } from '../api/reports'

const REASON_OPTIONS = Object.entries(REPORT_REASON_LABELS).map(([value, label]) => ({
  value,
  label,
}))

/** Bouton et fenêtre de signalement (DL-36). */
export default function ReportButton({
  targetType,
  targetId,
  label = 'Signaler',
}: {
  targetType: ReportTargetType
  targetId: number
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason>('SPAM')
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      await sendReport({ target_type: targetType, target_id: targetId, reason, details })
      setDone(true)
      setOpen(false)
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(
          cause.code === 'duplicate_report'
            ? 'Vous avez déjà signalé cet élément.'
            : cause.status === 429
              ? 'Vous avez atteint la limite de signalements pour aujourd’hui.'
              : cause.message,
        )
      } else {
        setError('Impossible de contacter le serveur.')
      }
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <p role="status" className="text-sm text-emerald-800">
        Signalement envoyé. Merci.
      </p>
    )
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>

      <Modal open={open} title="Signaler un contenu" onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <p className="text-sm text-ink-600">
            Votre signalement est transmis à l'équipe. Il reste confidentiel.
          </p>
          <Select
            label="Motif"
            value={reason}
            options={REASON_OPTIONS}
            onChange={(event) => setReason(event.target.value as ReportReason)}
          />
          <Textarea
            label="Précisions (facultatif)"
            value={details}
            maxLength={1000}
            onChange={(event) => setDetails(event.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="danger" loading={sending}>
              Envoyer le signalement
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
