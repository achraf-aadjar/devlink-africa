import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  ErrorState,
  Field,
  LoadingState,
  Select,
  Textarea,
} from '../../../components/ui'
import { ApiError } from '../../../lib/api'
import { PROJECT_STATUS_LABELS } from '../../../lib/labels'
import type { ProjectStatus } from '../../../lib/types'
import { useQuery } from '../../../lib/useQuery'
import { listCatalog } from '../../skills/api/skills'
import ProjectSummaryButton from '../../ai/components/ProjectSummaryButton'
import { createProject, getProject, updateProject } from '../api/projects'

const STATUS_OPTIONS = Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

interface FormState {
  title: string
  description: string
  status: ProjectStatus
  repo_url: string
  demo_url: string
  needs: number[]
}

/** Création et modification d'un projet (DL-22). */
export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = id ? Number(id) : null
  const navigate = useNavigate()

  const catalog = useQuery(() => listCatalog(), [])
  const existing = useQuery(
    () => (projectId ? getProject(projectId) : Promise.resolve(null)),
    [projectId],
  )

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    status: 'OPEN',
    repo_url: '',
    demo_url: '',
    needs: [],
  })
  const [loadedId, setLoadedId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.title.trim()) {
      setErrors({ title: 'Donnez un titre à votre projet.' })
      return
    }

    setSaving(true)
    setErrors({})
    try {
      const saved = projectId ? await updateProject(projectId, form) : await createProject(form)
      navigate(`/projets/${saved.id}`)
    } catch (cause) {
      if (cause instanceof ApiError) {
        const found: Record<string, string> = {}
        Object.entries(cause.fieldErrors).forEach(([field, messages]) => {
          found[field] = messages[0]
        })
        if (Object.keys(found).length === 0) found.form = cause.message
        setErrors(found)
      } else {
        setErrors({ form: 'Impossible de contacter le serveur. Réessayez.' })
      }
    } finally {
      setSaving(false)
    }
  }

  if (projectId && existing.loading) return <LoadingState rows={3} label="Chargement du projet…" />
  if (projectId && existing.error) return <ErrorState onRetry={existing.reload} />

  // En modification : on remplit le formulaire au premier rendu où la donnée
  // est disponible, sans passer par un effet.
  if (existing.data && loadedId !== existing.data.id) {
    const project = existing.data
    setLoadedId(project.id)
    setForm({
      title: project.title,
      description: project.description,
      status: project.status,
      repo_url: project.repo_url,
      demo_url: project.demo_url,
      needs: project.needs.map((skill) => skill.id),
    })
    return <LoadingState rows={3} label="Préparation du formulaire…" />
  }

  return (
    <section className="mx-auto w-full max-w-2xl flex-col gap-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-ink-900">
        {projectId ? 'Modifier le projet' : 'Proposer un projet'}
      </h1>

      <Card>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <Field
            label="Titre"
            required
            value={form.title}
            error={errors.title}
            maxLength={150}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />

          <Textarea
            label="Description"
            value={form.description}
            error={errors.description}
            maxLength={5000}
            hint="Le problème résolu, l'état d'avancement, ce que vous cherchez."
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />

          <ProjectSummaryButton
            description={form.description}
            onUse={(summary) => setForm({ ...form, description: summary })}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-ink-800">Compétences recherchées</legend>
            <div className="flex flex-wrap gap-3">
              {(catalog.data?.results ?? []).map((skill) => (
                <label key={skill.id} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={form.needs.includes(skill.id)}
                    onChange={() =>
                      setForm({
                        ...form,
                        needs: form.needs.includes(skill.id)
                          ? form.needs.filter((value) => value !== skill.id)
                          : [...form.needs, skill.id],
                      })
                    }
                    className="h-4 w-4 rounded border-ink-300 text-accent-600"
                  />
                  {skill.name}
                </label>
              ))}
            </div>
          </fieldset>

          <Select
            label="Statut"
            value={form.status}
            options={STATUS_OPTIONS}
            onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Dépôt du code (https)"
              type="url"
              value={form.repo_url}
              error={errors.repo_url}
              placeholder="https://..."
              onChange={(event) => setForm({ ...form, repo_url: event.target.value })}
            />
            <Field
              label="Démonstration (https)"
              type="url"
              value={form.demo_url}
              error={errors.demo_url}
              placeholder="https://..."
              onChange={(event) => setForm({ ...form, demo_url: event.target.value })}
            />
          </div>

          {errors.form && (
            <p role="alert" className="text-sm text-red-400">
              {errors.form}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              {projectId ? 'Enregistrer' : 'Publier le projet'}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  )
}
