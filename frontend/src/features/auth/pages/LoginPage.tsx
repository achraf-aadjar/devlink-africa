import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Field } from '../../../components/ui'
import { ApiError } from '../../../lib/api'
import { useAuth } from '../hooks/useAuth'

type Errors = Partial<Record<'email' | 'password' | 'form', string>>

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  // Page demandée avant la redirection vers la connexion (voir RequireAuth).
  const from = (location.state as { from?: string } | null)?.from ?? '/tableau-de-bord'

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const found: Errors = {}
    if (!values.email.trim()) found.email = 'Indiquez votre adresse e-mail.'
    if (!values.password) found.password = 'Indiquez votre mot de passe.'
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
              ? 'Adresse e-mail ou mot de passe incorrect.'
              : error.status === 429
                ? error.message
                : error.fieldErrors.email || error.fieldErrors.password
                  ? undefined
                  : error.message,
        })
      } else {
        setErrors({ form: 'Impossible de contacter le serveur. Réessayez dans un instant.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-1 text-2xl font-bold text-ink-900">Se connecter</h1>
      <p className="mb-6 text-sm text-ink-600">Retrouvez vos matchs et vos échanges.</p>

      <Card>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Field
            label="Adresse e-mail"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={values.email}
            error={errors.email}
            onChange={(event) => setValues({ ...values, email: event.target.value })}
          />
          <Field
            label="Mot de passe"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={values.password}
            error={errors.password}
            onChange={(event) => setValues({ ...values, password: event.target.value })}
          />

          {errors.form && (
            <p role="alert" className="text-sm text-red-700">
              {errors.form}
            </p>
          )}

          <Button type="submit" loading={submitting} className="mt-2">
            Se connecter
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-ink-600">
        Pas encore de compte ?{' '}
        <Link to="/inscription" className="font-medium text-accent-700 underline">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
