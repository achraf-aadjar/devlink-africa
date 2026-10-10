import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Field } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import { confirmPasswordReset } from '../api/auth'

const MIN_PASSWORD_LENGTH = 10

export default function ResetPasswordPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const uid = params.get('uid') ?? ''
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [linkInvalid, setLinkInvalid] = useState(!uid || !token)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('Le mot de passe doit contenir au moins 10 caractères.'))
      return
    }

    setError(undefined)
    setSubmitting(true)
    try {
      await confirmPasswordReset({ uid, token, password })
      navigate('/connexion', { replace: true, state: { passwordReset: true } })
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'invalid_reset_token') {
        setLinkInvalid(true)
      } else if (caught instanceof ApiError) {
        setError(caught.fieldError('password') ?? caught.message)
      } else {
        setError(t('Impossible de contacter le serveur. Réessayez dans un instant.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (linkInvalid) {
    return (
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-ink-900">
          {t('Lien invalide')}
        </h1>
        <p role="alert" className="mb-6 text-sm text-ink-600">
          {t('Ce lien est invalide ou a expiré. Demandez-en un nouveau.')}
        </p>
        <Link
          to="/mot-de-passe/oublie"
          className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-base font-medium text-white transition hover:bg-brand-hover"
        >
          {t('Demander un nouveau lien')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-1 text-3xl font-bold tracking-tight text-ink-900">
        {t('Nouveau mot de passe')}
      </h1>
      <p className="mb-6 text-sm text-ink-600">
        {t('Choisissez un mot de passe d’au moins 10 caractères.')}
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field
          label={t('Nouveau mot de passe')}
          name="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          error={error}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button
          type="submit"
          loading={submitting}
          className="mt-2 w-full !rounded-xl border border-transparent !px-4 !py-2.5 !text-base !shadow-none"
        >
          {t('Changer le mot de passe')}
        </Button>
      </form>
    </div>
  )
}
