import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Field, Modal } from '../../../components/ui'
import { ApiError } from '../../../lib/api'
import { useAuth } from '../../auth/hooks/useAuth'
import { deleteMyAccount, exportMyData } from '../api/profile'

/**
 * Mes données personnelles : export et suppression (DL-40).
 *
 * Ces deux droits sont imposés par la loi n° 2008-12. L'export se télécharge
 * en JSON ; la suppression redemande le mot de passe, car elle est définitive.
 */
export default function PersonalDataCard() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [exporting, setExporting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setExporting(true)
    setError(null)
    try {
      const data = await exportMyData()
      // Téléchargement côté navigateur : aucune dépendance nécessaire.
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'mes-donnees-devlink-africa.json'
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("L'export n'a pas pu être généré. Réessayez.")
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete(event: React.FormEvent) {
    event.preventDefault()
    setDeleting(true)
    setError(null)
    try {
      await deleteMyAccount(password)
      await signOut()
      navigate('/', { replace: true })
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.fieldError('password') ?? cause.message)
      } else {
        setError('Impossible de contacter le serveur.')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-semibold text-ink-900">Mes données personnelles</h2>
        <p className="mt-1 text-sm text-ink-600">
          Vous pouvez obtenir une copie de vos données ou supprimer définitivement votre compte.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" loading={exporting} onClick={handleExport}>
          Télécharger mes données
        </Button>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          Supprimer mon compte
        </Button>
      </div>

      <Modal
        open={confirmOpen}
        title="Supprimer définitivement mon compte"
        onClose={() => setConfirmOpen(false)}
      >
        <form onSubmit={handleDelete} noValidate className="flex flex-col gap-4">
          <p className="text-sm text-ink-700">
            Cette action est <strong>irréversible</strong>. Votre profil, vos compétences, vos
            projets et vos échanges seront effacés.
          </p>
          <Field
            label="Confirmez avec votre mot de passe"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="danger" loading={deleting}>
              Supprimer définitivement
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}
