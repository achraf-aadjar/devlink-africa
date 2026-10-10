import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Field } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { useAuth } from '../hooks/useAuth'
import { useGoogleClientId } from '../hooks/useGoogleClientId'

type Errors = Partial<Record<'email' | 'password' | 'form', string>>

export default function LoginPage() {
  const { signIn } = useAuth()
  const { t } = useI18n()
  const { clientId: googleClientId } = useGoogleClientId()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  // Page demandée avant la redirection vers la connexion (voir RequireAuth).
  const state = location.state as { from?: string; passwordReset?: boolean } | null
  const from = state?.from ?? '/tableau-de-bord'

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const found: Errors = {}
    if (!values.email.trim()) found.email = t('Indiquez votre adresse e-mail.')
    if (!values.password) found.password = t('Indiquez votre mot de passe.')
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await signIn(values.email.trim().toLowerCase(), values.password)
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          email: error.fieldError('email'),
          password: error.fieldError('password'),
          // 401 : le message ne dit pas lequel des deux champs est faux.
          form:
            error.status === 401
              ? t('Adresse e-mail ou mot de passe incorrect.')
              : error.status === 429
                ? error.message
                : error.fieldErrors.email || error.fieldErrors.password
                  ? undefined
                  : error.message,
        })
      } else {
        setErrors({ form: t('Impossible de contacter le serveur. Réessayez dans un instant.') })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-1 text-3xl font-bold tracking-tight text-ink-900">{t('Se connecter')}</h1>
      <p className="mb-6 text-sm text-ink-600">{t('Retrouvez vos matchs et vos échanges.')}</p>

      {state?.passwordReset && (
        <p role="status" className="mb-4 text-sm text-ink-800">
          {t('Mot de passe modifié. Connectez-vous avec le nouveau.')}
        </p>
      )}

      <div>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Field
            label={t('Adresse e-mail')}
            name="email"
            type="email"
            required
            autoComplete="email"
            value={values.email}
            error={errors.email}
            onChange={(event) => setValues({ ...values, email: event.target.value })}
          />
          <Field
            label={t('Mot de passe')}
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={values.password}
            error={errors.password}
            onChange={(event) => setValues({ ...values, password: event.target.value })}
          />
          <Link
            to="/mot-de-passe/oublie"
            className="-mt-2 w-fit text-sm text-accent-700 underline hover:text-accent-800"
          >
            {t('Mot de passe oublié ?')}
          </Link>

          {errors.form && (
            <p role="alert" className="text-sm text-red-400">
              {errors.form}
            </p>
          )}

          <Button
            type="submit"
            loading={submitting}
            className="mt-2 w-full !rounded-xl border border-transparent !px-4 !py-2.5 !text-base !shadow-none"
          >
            {t('Se connecter')}
          </Button>
        </form>

        {googleClientId && (
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-ink-500">
              <span className="h-px flex-1 bg-ink-200" aria-hidden="true" />
              {t('ou')}
              <span className="h-px flex-1 bg-ink-200" aria-hidden="true" />
            </div>
            <GoogleSignInButton
              redirectTo={from}
              onError={(message) => setErrors({ form: message })}
            />
            <p className="text-center text-xs text-ink-500">
              {t('En continuant, vous acceptez notre')}{' '}
              <Link to="/confidentialite" className="underline hover:text-accent-700">
                {t('politique de confidentialité')}
              </Link>
              .
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-ink-600">
        {t('Pas encore de compte ?')}{' '}
        <Link to="/inscription" className="font-medium text-accent-700 underline">
          {t('Créer un compte')}
        </Link>
      </p>
    </div>
  )
}
