import { useState } from 'react'
import { Link } from 'react-router-dom'
import SkillBadge from '../../../components/SkillBadge'
import { Button, Card, ErrorState, LoadingState, Select } from '../../../components/ui'
import { ApiError } from '../../../lib/api'
import { CATEGORY_LABELS, LEVEL_LABELS } from '../../../lib/labels'
import type { SkillKind, SkillLevel, UserSkill } from '../../../lib/types'
import { useQuery } from '../../../lib/useQuery'
import SkillExtractor from '../../ai/components/SkillExtractor'
import { addSkill, getMySkills, listCatalog, removeSkill, updateSkillLevel } from '../api/skills'

const LEVEL_OPTIONS = Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }))

export default function SkillsPage() {
  const catalog = useQuery(() => listCatalog(), [])
  const mine = useQuery(() => getMySkills(), [])
  const [notice, setNotice] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleAdd(kind: SkillKind, skillId: number, level: SkillLevel) {
    setFormError(null)
    setNotice(null)
    try {
      await addSkill({ skill: skillId, kind, level })
      setNotice(
        kind === 'OFFERED'
          ? 'Compétence ajoutée. Vos matchs ont été recalculés.'
          : 'Souhait ajouté. Vos matchs ont été recalculés.',
      )
      mine.reload()
    } catch (error) {
      if (error instanceof ApiError && error.code === 'duplicate_skill') {
        setFormError('Vous avez déjà déclaré cette compétence dans cette catégorie.')
      } else {
        setFormError("La compétence n'a pas pu être ajoutée. Réessayez.")
      }
    }
  }

  async function handleRemove(entry: UserSkill) {
    setFormError(null)
    try {
      await removeSkill(entry.id)
      setNotice('Compétence retirée. Vos matchs ont été recalculés.')
      mine.reload()
    } catch {
      setFormError("La compétence n'a pas pu être retirée.")
    }
  }

  async function handleLevel(entry: UserSkill, level: SkillLevel) {
    try {
      await updateSkillLevel(entry.id, level)
      mine.reload()
    } catch {
      setFormError("Le niveau n'a pas pu être modifié.")
    }
  }

  if (mine.loading || catalog.loading) {
    return <LoadingState rows={3} label="Chargement de vos compétences…" />
  }
  if (mine.error) return <ErrorState onRetry={mine.reload} />
  if (!mine.data || !catalog.data) return null

  const skills = catalog.data.results
  const declared = new Set(
    [...mine.data.offered, ...mine.data.wanted].map((entry) => `${entry.kind}:${entry.skill.id}`),
  )

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">Mes compétences</h1>
        <p className="mt-1 text-sm text-ink-600">
          Déclarez ce que vous savez faire et ce que vous voulez apprendre. Dev Match s'appuie sur
          ces deux listes.
        </p>
      </header>

      {notice && (
        <p
          role="status"
          className="rounded-lg bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300"
        >
          {notice}
        </p>
      )}
      {formError && (
        <p role="alert" className="rounded-lg bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {formError}
        </p>
      )}

      <SkillExtractor onAccept={handleAdd} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SkillColumn
          title="Je sais faire"
          description="Ce que vous pouvez enseigner à quelqu'un."
          kind="OFFERED"
          entries={mine.data.offered}
          skills={skills}
          declared={declared}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onLevel={handleLevel}
        />
        <SkillColumn
          title="Je veux apprendre"
          description="Ce que vous cherchez chez les autres."
          kind="WANTED"
          entries={mine.data.wanted}
          skills={skills}
          declared={declared}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      </div>

      <Card className="bg-accent-50">
        <p className="text-sm text-accent-900">
          Vos compétences sont à jour ?{' '}
          <Link to="/matchs" className="font-medium underline">
            Voir vos matchs
          </Link>
        </p>
      </Card>
    </section>
  )
}

interface ColumnProps {
  title: string
  description: string
  kind: SkillKind
  entries: UserSkill[]
  skills: Array<{ id: number; name: string; category: keyof typeof CATEGORY_LABELS }>
  declared: Set<string>
  onAdd: (kind: SkillKind, skillId: number, level: SkillLevel) => void
  onRemove: (entry: UserSkill) => void
  onLevel?: (entry: UserSkill, level: SkillLevel) => void
}

function SkillColumn({
  title,
  description,
  kind,
  entries,
  skills,
  declared,
  onAdd,
  onRemove,
  onLevel,
}: ColumnProps) {
  const [skillId, setSkillId] = useState('')
  const [level, setLevel] = useState<SkillLevel>('INTERMEDIATE')

  const available = skills.filter((skill) => !declared.has(`${kind}:${skill.id}`))
  const options = available.map((skill) => ({
    value: String(skill.id),
    label: `${skill.name} — ${CATEGORY_LABELS[skill.category]}`,
  }))

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-semibold text-ink-900">{title}</h2>
        <p className="mt-0.5 text-sm text-ink-600">{description}</p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-ink-500">Aucune compétence déclarée pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center gap-2">
              <SkillBadge
                name={entry.skill.name}
                kind={entry.kind}
                level={kind === 'OFFERED' ? entry.level : undefined}
                proofsCount={entry.proofs_count}
              />
              {kind === 'OFFERED' && onLevel && (
                <select
                  aria-label={`Niveau pour ${entry.skill.name}`}
                  value={entry.level}
                  onChange={(event) => onLevel(entry, event.target.value as SkillLevel)}
                  className="rounded border border-ink-300 bg-ink-100 px-2 py-1 text-xs text-ink-700"
                >
                  {LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => onRemove(entry)}
                className="ml-auto rounded px-2 py-1 text-xs font-medium text-ink-600 hover:bg-ink-200 hover:text-red-400"
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-col gap-3 border-t border-ink-200 pt-4">
        <Select
          label="Ajouter une compétence"
          value={skillId}
          options={options}
          placeholder={available.length ? 'Choisir…' : 'Tout est déjà déclaré'}
          onChange={(event) => setSkillId(event.target.value)}
        />
        {kind === 'OFFERED' && (
          <Select
            label="Votre niveau"
            value={level}
            options={LEVEL_OPTIONS}
            onChange={(event) => setLevel(event.target.value as SkillLevel)}
          />
        )}
        <Button
          type="button"
          size="sm"
          disabled={!skillId}
          onClick={() => {
            onAdd(kind, Number(skillId), level)
            setSkillId('')
          }}
        >
          Ajouter
        </Button>
      </div>
    </Card>
  )
}
