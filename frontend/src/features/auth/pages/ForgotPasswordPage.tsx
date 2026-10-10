import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Field } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import { requestPasswordReset } from '../api/auth'

export default function ForgotPasswordPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!email.trim()) {
      setError(t('Indiquez votre adresse e-mail.'))
      return
    }

    setError(undefined)
    setSubmitting(true)
    try {
      await requestPasswordReset(email.trim().toLowerCase())
      setSent(true)
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.fieldError('email') ?? caught.message)
          : t('Impossible de contacter le serveur. Réessayez dans un instant.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-1 text-3xl font-bold tracking-tight text-ink-900">
        {t('Mot de passe oublié')}
      </h1>
      <p className="mb-6 text-sm text-ink-600">
        {t(
          'Indiquez votre adresse e-mail : nous vous envoyons un lien pour en choisir un nouveau.',
        )}
      </p>

      {sent ? (
        <p role="status" className="rounded-xl border border-ink-300 p-4 text-sm text-ink-800">
          {t(
            'Si un compte existe pour cette adresse, un e-mail vient d’être envoyé. Le lien est valable une heure.',
          )}
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Field
            label={t('Adresse e-mail')}
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            error={error}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button
            type="submit"
            loading={submitting}
            className="mt-2 w-full !rounded-xl border border-transparent !px-4 !py-2.5 !text-base !shadow-none"
          >
            {t('Envoyer le lien')}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-ink-600">
        <Link to="/connexion" className="font-medium text-accent-700 underline">
          {t('Retour à la connexion')}
        </Link>
      </p>
    </div>
  )
}
