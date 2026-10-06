import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DemoBadge from '../../../components/DemoBadge'
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  Modal,
  Textarea,
} from '../../../components/ui'
import { ApiError } from '../../../lib/api'
import { countryFlag, JOIN_STATUS_LABELS, PROJECT_STATUS_LABELS } from '../../../lib/labels'
import { useQuery } from '../../../lib/useQuery'
import { useAuth } from '../../auth/hooks/useAuth'
import ReportButton from '../../reports/components/ReportButton'
import { decideJoinRequest, deleteProject, getProject, joinProject } from '../api/projects'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { data, loading, error, reload } = useQuery(() => getProject(projectId), [projectId])

  const [joinOpen, setJoinOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const isOwner = Boolean(data && user && data.owner.id === user.id)

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault()
    if (!message.trim()) {
      setActionError('Expliquez en quelques mots ce que vous apportez.')
      return
    }
    setSending(true)
    setActionError(null)
    try {
      await joinProject(projectId, message.trim())
      setNotice('Votre demande a été envoyée au porteur du projet.')
      setJoinOpen(false)
      setMessage('')
      reload()
    } catch (cause) {
      if (cause instanceof ApiError) {
        setActionError(
          cause.code === 'duplicate_request'
            ? 'Vous avez déjà une demande en attente sur ce projet.'
            : cause.message,
        )
      } else {
        setActionError('Impossible de contacter le serveur.')
      }
    } finally {
      setSending(false)
    }
  }

  async function handleDecision(requestId: number, status: 'ACCEPTED' | 'DECLINED') {
    setActionError(null)
    try {
      await decideJoinRequest(requestId, status)
      setNotice(status === 'ACCEPTED' ? 'Demande acceptée.' : 'Demande refusée.')
      reload()
    } catch {
      setActionError("La demande n'a pas pu être traitée.")
    }
  }

  async function handleDelete() {
    if (!window.confirm('Supprimer définitivement ce projet ?')) return
    try {
      await deleteProject(projectId)
      navigate('/projets')
    } catch {
      setActionError("Le projet n'a pas pu être supprimé.")
    }
  }

  if (loading) return <LoadingState rows={4} label="Chargement du projet…" />
  if (error) {
    const notFound = error instanceof ApiError && error.status === 404
    return (
      <ErrorState
        message={notFound ? "Ce projet n'existe pas." : "Le projet n'a pas pu être chargé."}
        onRetry={notFound ? undefined : reload}
      />
    )
  }
  if (!data) return null

  return (
    <section className="flex flex-col gap-6">
      <nav aria-label="Fil d'Ariane">
        <Link to="/projets" className="text-sm text-ink-600 hover:text-accent-700 hover:underline">
          ← Project Hub
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{data.title}</h1>
          <p className="mt-1 text-sm text-ink-600">
            Porté par{' '}
            <Link to={`/developpeurs/${data.owner.id}`} className="hover:underline">
              {data.owner.full_name || 'un développeur'}
            </Link>
            {data.owner.country && (
              <>
                {' '}
                <span aria-hidden="true">{countryFlag(data.owner.country)}</span>
              </>
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={data.status === 'OPEN' ? 'success' : 'neutral'}>
              {PROJECT_STATUS_LABELS[data.status]}
            </Badge>
            <DemoBadge isDemo={data.owner.is_demo} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isOwner ? (
            <>
              <Link to={`/projets/${projectId}/modifier`}>
                <Button variant="secondary">Modifier</Button>
              </Link>
              <Button variant="danger" onClick={handleDelete}>
                Supprimer
              </Button>
            </>
          ) : (
            isAuthenticated && (
              <>
                <Button onClick={() => setJoinOpen(true)}>Rejoindre le projet</Button>
                <ReportButton targetType="PROJECT" targetId={projectId} label="Signaler" />
              </>
            )
          )}
        </div>
      </header>

      {notice && (
        <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </p>
      )}
      {actionError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </p>
      )}

      {data.description && (
        <Card>
          <h2 className="mb-2 font-semibold text-ink-900">Le projet</h2>
          <p className="whitespace-pre-line text-sm text-ink-700">{data.description}</p>
        </Card>
      )}

      {data.needs.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold text-ink-900">Compétences recherchées</h2>
          <ul className="flex flex-wrap gap-2">
            {data.needs.map((skill) => (
              <li key={skill.id}>
                <Badge tone="wanted">{skill.name}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {(data.repo_url || data.demo_url) && (
        <Card>
          <h2 className="mb-3 font-semibold text-ink-900">Liens</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {data.repo_url && (
              <li>
                <a
                  href={data.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-700 underline"
                >
                  Dépôt du code
                </a>
              </li>
            )}
            {data.demo_url && (
              <li>
                <a
                  href={data.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-700 underline"
                >
                  Démonstration en ligne
                </a>
              </li>
            )}
          </ul>
        </Card>
      )}

      {isOwner && data.join_requests && (
        <Card>
          <h2 className="mb-3 font-semibold text-ink-900">
            Demandes reçues ({data.join_requests.length})
          </h2>
          {data.join_requests.length === 0 ? (
            <p className="text-sm text-ink-600">Aucune demande pour le moment.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {data.join_requests.map((request) => (
                <li
                  key={request.id}
                  className="border-b border-ink-200 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/developpeurs/${request.applicant.id}`}
                      className="font-medium text-ink-900 hover:underline"
                    >
                      {request.applicant.full_name}
                    </Link>
                    <Badge tone={request.status === 'PENDING' ? 'warning' : 'neutral'}>
                      {JOIN_STATUS_LABELS[request.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-700">{request.message}</p>
                  {request.status === 'PENDING' && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => handleDecision(request.id, 'ACCEPTED')}>
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDecision(request.id, 'DECLINED')}
                      >
                        Refuser
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Modal open={joinOpen} title="Rejoindre ce projet" onClose={() => setJoinOpen(false)}>
        <form onSubmit={handleJoin} noValidate className="flex flex-col gap-4">
          <Textarea
            label="Votre message"
            required
            value={message}
            maxLength={1000}
            hint="Ce que vous pouvez apporter au projet."
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setJoinOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={sending}>
              Envoyer
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
