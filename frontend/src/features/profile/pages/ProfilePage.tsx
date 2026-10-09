import { useState } from 'react'
import { Button, Card, ErrorState, Field, LoadingState, Textarea } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import { AVAILABILITY_LABELS, DOMAIN_LABELS } from '../../../lib/labels'
import type { Availability, Domain } from '../../../lib/types'
import { useQuery } from '../../../lib/useQuery'
import { getMe, updateMe } from '../api/profile'
import CountrySelect from '../components/CountrySelect'
import PersonalDataCard from '../components/PersonalDataCard'

type Errors = Partial<Record<string, string>>

interface FormState {
  full_name: string
  country: string
  bio: string
  avatar_url: string
  contact: string
  availability: Availability[]
  domains: Domain[]
}

export default function ProfilePage() {
  const { t } = useI18n()
  const { data, loading, error, reload } = useQuery(() => getMe(), [])
  // Le formulaire est initialisé depuis la donnée chargée, sans effet : on garde
  // l'identifiant servant de base pour détecter un nouveau chargement.
  const [form, setForm] = useState<FormState | null>(null)
  const [baseId, setBaseId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  function toggle<T extends string>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form) return
    setSaving(true)
    setErrors({})
    setNotice(null)
    try {
      await updateMe(form)
      setNotice(t('Votre profil est enregistré.'))
      reload()
    } catch (cause) {
      if (cause instanceof ApiError) {
        const found: Errors = {}
        Object.entries(cause.fieldErrors).forEach(([field, messages]) => {
          found[field] = messages[0]
        })
        if (Object.keys(found).length === 0) found.form = cause.message
        setErrors(found)
      } else {
        setErrors({ form: t('Impossible de contacter le serveur. Réessayez.') })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState rows={4} label={t('Chargement de votre profil…')} />
  if (error) return <ErrorState onRetry={reload} />
  if (!data) return null

  // Première arrivée de la donnée, ou rechargement : on repart de ses valeurs.
  if (form === null || baseId !== data.id) {
    setBaseId(data.id)
    setForm({
      full_name: data.full_name,
      country: data.profile.country,
      bio: data.profile.bio,
      avatar_url: data.profile.avatar_url,
      contact: data.profile.contact,
      availability: data.profile.availability,
      domains: data.profile.domains,
    })
    return <LoadingState rows={4} label={t('Préparation du formulaire…')} />
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="page-header flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold leading-tight text-ink-900">{t('Mon profil')}</h1>
          <p className="mt-1 text-sm text-ink-600">{data.email}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-xs font-medium text-ink-600">
            {t('Profil complété')}{' '}
            <span className="text-2xl font-bold tabular-nums text-ink-900">
              {data.profile.completeness}%
            </span>
          </p>
          <div aria-hidden="true" className="progress w-48">
            <div className="progress-bar" style={{ width: `${data.profile.completeness}%` }} />
          </div>
        </div>
      </header>

      <Card>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field
              label={t('Nom complet')}
              value={form.full_name}
              error={errors.full_name}
              autoComplete="name"
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
            />
            <CountrySelect
              value={form.country}
              error={errors.country}
              onChange={(country) => setForm({ ...form, country })}
            />
          </div>

          <Textarea
            label={t('Présentation')}
            value={form.bio}
            error={errors.bio}
            maxLength={1000}
            hint={t('{count} / 1000 caractères.', { count: form.bio.length })}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-bold text-ink-800">{t('Disponibilités')}</legend>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(AVAILABILITY_LABELS) as Availability[]).map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={form.availability.includes(value)}
                    onChange={() =>
                      setForm({ ...form, availability: toggle(form.availability, value) })
                    }
                    className="h-4 w-4 rounded border-ink-300 text-accent-600"
                  />
                  {t(AVAILABILITY_LABELS[value])}
                </label>
              ))}
            </div>
            {errors.availability && <p className="text-sm text-[#a94442]">{errors.availability}</p>}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-bold text-ink-800">{t('Domaines')}</legend>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(DOMAIN_LABELS) as Domain[]).map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={form.domains.includes(value)}
                    onChange={() => setForm({ ...form, domains: toggle(form.domains, value) })}
                    className="h-4 w-4 rounded border-ink-300 text-accent-600"
                  />
                  {t(DOMAIN_LABELS[value])}
                </label>
              ))}
            </div>
            {errors.domains && <p className="text-sm text-[#a94442]">{errors.domains}</p>}
          </fieldset>

          <Field
            label={t('Moyen de contact')}
            value={form.contact}
            error={errors.contact}
            placeholder={t('vous@exemple.com ou https://github.com/vous')}
            hint={t(
              "Une adresse e-mail ou un lien https (GitHub, LinkedIn…). Il n'apparaît jamais sur votre profil public : seule la personne avec qui vous avez un échange accepté le voit.",
            )}
            onChange={(event) => setForm({ ...form, contact: event.target.value })}
          />

          <Field
            label={t('Adresse de votre photo (https)')}
            type="url"
            value={form.avatar_url}
            error={errors.avatar_url}
            placeholder="https://..."
            onChange={(event) => setForm({ ...form, avatar_url: event.target.value })}
          />

          {errors.form && (
            <p role="alert" className="text-sm text-[#a94442]">
              {errors.form}
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-[#3c763d]">
              {notice}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              {t('Enregistrer')}
            </Button>
          </div>
        </form>
      </Card>

      <PersonalDataCard />
    </section>
  )
}
