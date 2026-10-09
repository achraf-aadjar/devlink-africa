import { useState } from 'react'
import Icon from '../../../components/icons/Icon'
import { Button } from '../../../components/ui'
import { ApiError } from '../../../lib/api'
import { LEVEL_LABELS } from '../../../lib/labels'
import type { EndorsementCandidate } from '../../../lib/types'
import { endorseSkill, withdrawEndorsement } from '../api/endorsements'

const COMMENT_MAX = 280

/**
 * « Ce que Kofi vous a appris » : valider les compétences d'un partenaire avec
 * qui l'on a vraiment travaillé. Le backend vérifie que c'est permis ; ce
 * panneau n'apparaît que pour les personnes qu'il renvoie comme candidates.
 */
export default function EndorsePanel({
  candidate,
  onChange,
}: {
  candidate: EndorsementCandidate
  onChange: () => void
}) {
  const [editing, setEditing] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const firstName = candidate.user.full_name.split(' ')[0] || candidate.user.full_name

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      setEditing(null)
      setComment('')
      onChange()
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.message ? cause.message : "L'action n'a pas abouti.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      aria-label={`Valider les compétences de ${candidate.user.full_name}`}
      className="flex flex-col gap-3 rounded-2xl bg-accent-50/50 px-5 py-4 ring-1 ring-inset ring-accent-400/20"
    >
      <div>
        <p className="flex items-center gap-2 text-sm font-medium text-accent-900">
          <Icon name="proof" size={16} />
          Ce que {firstName} vous a appris
        </p>
        <p className="mt-0.5 text-xs text-ink-600">
          Votre validation apparaît sur son profil : elle transforme une compétence déclarée en
          compétence vérifiée.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {candidate.skills.map((skill) => (
          <li key={skill.user_skill} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-ink-900">
                {skill.name}
                <span className="ml-1 text-ink-500">· {LEVEL_LABELS[skill.level]}</span>
              </span>
              {skill.endorsement !== null ? (
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-sm text-emerald-300">
                    <Icon name="check" size={14} />
                    Validée
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => withdrawEndorsement(skill.endorsement as number))}
                    className="text-xs text-ink-500 underline hover:text-ink-800"
                  >
                    Retirer
                  </button>
                </span>
              ) : (
                editing !== skill.user_skill && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditing(skill.user_skill)}
                  >
                    Valider {skill.name}
                  </Button>
                )
              )}
            </div>

            {editing === skill.user_skill && (
              <form
                className="flex flex-col gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  void run(() => endorseSkill(skill.user_skill, comment))
                }}
              >
                <label className="text-xs text-ink-700" htmlFor={`comment-${skill.user_skill}`}>
                  Un mot sur ce qu'il ou elle vous a appris (facultatif)
                </label>
                <input
                  id={`comment-${skill.user_skill}`}
                  value={comment}
                  maxLength={COMMENT_MAX}
                  onChange={(event) => setComment(event.target.value)}
                  className="field text-sm text-ink-900"
                  placeholder="Patient, clair, très concret…"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" loading={busy}>
                    Confirmer la validation
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(null)
                      setComment('')
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            )}
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </section>
  )
}
