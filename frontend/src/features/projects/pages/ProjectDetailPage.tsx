import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DemoBadge from '../../../components/DemoBadge'
import Icon from '../../../components/icons/Icon'
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  Modal,
  Textarea,
} from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import { formatRelativeDate } from '../../../lib/date'
import { countryFlag, JOIN_STATUS_LABELS, PROJECT_STATUS_LABELS } from '../../../lib/labels'
import { useQuery } from '../../../lib/useQuery'
import { useAuth } from '../../auth/hooks/useAuth'
import ReportButton from '../../reports/components/ReportButton'
import { decideJoinRequest, deleteProject, getProject, joinProject } from '../api/projects'

/** Lien externe stylé comme un bouton secondaire : un vrai `<a>`, pas un bouton imbriqué. */
function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="btn">
      <Icon name="external" size={16} />
      {children}
    </a>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const navigate = useNavigate()
  const { t, tn, lang } = useI18n()
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
      setActionError(t('Expliquez en quelques mots ce que vous apportez.'))
      return
    }
    setSending(true)
    setActionError(null)
    try {
      await joinProject(projectId, message.trim())
      setNotice(t('Votre demande a été envoyée au porteur du projet.'))
      setJoinOpen(false)
      setMessage('')
      reload()
    } catch (cause) {
      if (cause instanceof ApiError) {
        setActionError(
          cause.code === 'duplicate_request'
            ? t('Vous avez déjà une demande en attente sur ce projet.')
            : cause.message,
        )
      } else {
        setActionError(t('Impossible de contacter le serveur.'))
      }
    } finally {
      setSending(false)
    }
  }

  async function handleDecision(requestId: number, status: 'ACCEPTED' | 'DECLINED') {
    setActionError(null)
    try {
      await decideJoinRequest(requestId, status)
      setNotice(status === 'ACCEPTED' ? t('Demande acceptée.') : t('Demande refusée.'))
      reload()
    } catch {
      setActionError(t("La demande n'a pas pu être traitée."))
    }
  }

  async function handleDelete() {
    if (!window.confirm(t('Supprimer définitivement ce projet ?'))) return
    try {
      await deleteProject(projectId)
      navigate('/projets')
    } catch {
      setActionError(t("Le projet n'a pas pu être supprimé."))
    }
  }

  if (loading) return <LoadingState rows={4} label={t('Chargement du projet…')} />
  if (error) {
    const notFound = error instanceof ApiError && error.status === 404
    return (
      <ErrorState
        message={notFound ? t("Ce projet n'existe pas.") : t("Le projet n'a pas pu être chargé.")}
        onRetry={notFound ? undefined : reload}
      />
    )
  }
  if (!data) return null

  const created = formatRelativeDate(data.created_at, lang)
  const updated = formatRelativeDate(data.updated_at, lang)

  return (
    <section className="flex flex-col gap-6">
      <nav aria-label={t("Fil d'Ariane")}>
        <Link to="/projets" className="text-sm text-ink-600 hover:text-accent-700 hover:underline">
          ← Project Hub
        </Link>
      </nav>

      {/* Sur petit écran, les actions passent sous le titre au lieu de l'écraser. */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-accent-200 bg-accent-50 text-accent-700"
          >
            <Icon name="project" size={28} />
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] font-bold leading-tight text-ink-900">{data.title}</h1>
            <p className="mt-1 text-sm text-ink-600">
              {t('Porté par')}{' '}
              <Link to={`/developpeurs/${data.owner.id}`} className="hover:underline">
                {data.owner.full_name || t('un développeur')}
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
                {t(PROJECT_STATUS_LABELS[data.status])}
              </Badge>
              <DemoBadge isDemo={data.owner.is_demo} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
          {data.repo_url && <LinkButton href={data.repo_url}>{t('Dépôt du code')}</LinkButton>}
          {data.demo_url && (
            <LinkButton href={data.demo_url}>{t('Démonstration en ligne')}</LinkButton>
          )}
          {isOwner ? (
            <>
              <Link to={`/projets/${projectId}/modifier`}>
                <Button variant="secondary">{t('Modifier')}</Button>
              </Link>
              <Button variant="danger" onClick={handleDelete}>
                {t('Supprimer')}
              </Button>
            </>
          ) : (
            isAuthenticated && (
              <>
                <Button onClick={() => setJoinOpen(true)}>{t('Rejoindre le projet')}</Button>
                <ReportButton targetType="PROJECT" targetId={projectId} label={t('Signaler')} />
              </>
            )
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500">
        {created && (
          <>
            <span>{t('Créé {date}', { date: created })}</span>
            <span aria-hidden="true">·</span>
          </>
        )}
        {updated && <span>{t('Mis à jour {date}', { date: updated })}</span>}
        {data.needs.length > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              {tn(data.needs.length, '{n} compétence recherchée', '{n} compétences recherchées')}
            </span>
          </>
        )}
        {data.join_requests_count > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span>{tn(data.join_requests_count, '{n} demande', '{n} demandes')}</span>
          </>
        )}
      </div>

      {notice && (
        <p role="status" className="alert alert-success">
          {notice}
        </p>
      )}
      {actionError && (
        <p role="alert" className="alert alert-danger">
          {actionError}
        </p>
      )}

      {data.description && (
        <Card>
          <h2 className="mb-2 font-semibold text-ink-900">{t('Le projet')}</h2>
          <p className="whitespace-pre-line text-sm text-ink-700">{data.description}</p>
        </Card>
      )}

      {data.needs.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold text-ink-900">{t('Compétences recherchées')}</h2>
          <ul className="flex flex-wrap gap-2">
            {data.needs.map((skill) => (
              <li key={skill.id}>
                <Badge tone="wanted">{skill.name}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isOwner && data.join_requests && (
        <Card>
          <h2 className="mb-3 font-semibold text-ink-900">
            {t('Demandes reçues ({count})', { count: data.join_requests.length })}
          </h2>
          {data.join_requests.length === 0 ? (
            <p className="text-sm text-ink-600">{t('Aucune demande pour le moment.')}</p>
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
                      {t(JOIN_STATUS_LABELS[request.status])}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-700">{request.message}</p>
                  {request.status === 'PENDING' && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => handleDecision(request.id, 'ACCEPTED')}>
                        {t('Accepter')}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDecision(request.id, 'DECLINED')}
                      >
                        {t('Refuser')}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Modal open={joinOpen} title={t('Rejoindre ce projet')} onClose={() => setJoinOpen(false)}>
        <form onSubmit={handleJoin} noValidate className="flex flex-col gap-4">
          <Textarea
            label={t('Votre message')}
            required
            value={message}
            maxLength={1000}
            hint={t('Ce que vous pouvez apporter au projet.')}
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setJoinOpen(false)}>
              {t('Annuler')}
            </Button>
            <Button type="submit" loading={sending}>
              {t('Envoyer')}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
