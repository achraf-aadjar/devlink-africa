import { useState } from 'react'
import { Button, Field, Select, Textarea } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import { PROOF_KIND_LABELS } from '../../../lib/labels'
import type { SkillProofKind, UserSkill } from '../../../lib/types'
import { addProof, removeProof } from '../api/skills'

const KIND_OPTIONS = Object.entries(PROOF_KIND_LABELS).map(([value, label]) => ({ value, label }))

type Errors = Partial<Record<'title' | 'url' | 'description' | 'form', string>>

const emptyForm = { kind: 'PROJECT' as SkillProofKind, title: '', url: '', description: '' }

/**
 * Preuves d'une compétence déclarée : ce qui rend « Python · Avancé »
 * vérifiable plutôt qu'une simple affirmation (DL-31).
 *
 * Repliée par défaut (une compétence sans preuve est le cas courant) ;
 * dépliée, elle liste les preuves existantes et propose d'en ajouter une.
 */
export default function ProofManager({
  entry,
  onChange,
}: {
  entry: UserSkill
  onChange: () => void
}) {
  const { t, tn } = useI18n()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const proofs = entry.proofs ?? []

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    if (!form.title.trim()) {
      setErrors({ title: t('Donnez un titre à cette preuve.') })
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await addProof(entry.id, {
        kind: form.kind,
        title: form.title.trim(),
        url: form.url.trim() || undefined,
        description: form.description.trim() || undefined,
      })
      setForm(emptyForm)
      setAdding(false)
      onChange()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          title: error.fieldError('title'),
          url: error.fieldError('url'),
          description: error.fieldError('description'),
          form: error.fieldError('title') || error.fieldError('url') ? undefined : error.message,
        })
      } else {
        setErrors({ form: t('Impossible de contacter le serveur. Réessayez dans un instant.') })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(proofId: number) {
    setRemovingId(proofId)
    try {
      await removeProof(entry.id, proofId)
      onChange()
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="mt-1 w-full">
      <button
        type="button"
        onClick={() => {
          // Sans preuve existante, un seul clic ouvre directement le
          // formulaire : rien d'autre à montrer dans la section repliée.
          if (proofs.length === 0) setAdding(true)
          setOpen((value) => !value)
        }}
        aria-expanded={open}
        className="text-xs font-medium text-accent-700 hover:underline"
      >
        {proofs.length > 0
          ? tn(proofs.length, '{n} preuve', '{n} preuves')
          : t('Ajouter une preuve')}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-2 border-l-2 border-ink-200 pl-3">
          {proofs.length > 0 && (
            <ul className="flex flex-col gap-2">
              {proofs.map((proof) => (
                <li key={proof.id} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    {proof.url ? (
                      <a
                        href={proof.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-accent-700 hover:underline"
                      >
                        {proof.title}
                      </a>
                    ) : (
                      <span className="font-medium text-ink-800">{proof.title}</span>
                    )}
                    <span className="ml-2 text-xs text-ink-500">
                      {t(PROOF_KIND_LABELS[proof.kind])}
                    </span>
                    {proof.description && (
                      <p className="text-xs text-ink-600">{proof.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(proof.id)}
                    disabled={removingId === proof.id}
                    className="shrink-0 text-xs font-medium text-ink-600 hover:text-danger"
                  >
                    {t('Retirer')}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {adding ? (
            <form onSubmit={handleAdd} className="flex flex-col gap-2">
              <Select
                label={t('Type de preuve')}
                value={form.kind}
                options={KIND_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
                onChange={(event) =>
                  setForm({ ...form, kind: event.target.value as SkillProofKind })
                }
              />
              <Field
                label={t('Titre')}
                value={form.title}
                error={errors.title}
                maxLength={150}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
              <Field
                label={t('Lien (facultatif)')}
                type="url"
                value={form.url}
                error={errors.url}
                placeholder="https://…"
                onChange={(event) => setForm({ ...form, url: event.target.value })}
              />
              <Textarea
                label={t('Description (facultative)')}
                value={form.description}
                error={errors.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
              {errors.form && (
                <p role="alert" className="text-xs text-danger">
                  {errors.form}
                </p>
              )}
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={submitting}>
                  {t('Ajouter')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAdding(false)
                    setErrors({})
                    // Sans preuve existante, le bouton « Annuler » doit
                    // ramener au seul bouton visible au départ (la bascule),
                    // pas à une section vide portant le même libellé qu'elle.
                    if (proofs.length === 0) setOpen(false)
                  }}
                >
                  {t('Annuler')}
                </Button>
              </div>
            </form>
          ) : (
            <Button type="button" size="sm" variant="secondary" onClick={() => setAdding(true)}>
              {t('Ajouter une preuve')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
