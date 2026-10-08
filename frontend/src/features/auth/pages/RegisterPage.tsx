import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Field } from '../../../components/ui'
import { ApiError } from '../../../lib/api'
import { updateMe } from '../../profile/api/profile'
import CountrySelect from '../../profile/components/CountrySelect'
import { useAuth } from '../hooks/useAuth'

const MIN_PASSWORD_LENGTH = 10

type Errors = Partial<Record<'email' | 'password' | 'full_name' | 'consent' | 'form', string>>

/** Validation locale, alignée sur les règles du backend (docs/api.md § 3). */
function validate(values: { email: string; password: string; consent: boolean }): Errors {
  const errors: Errors = {}
  if (!values.email.trim()) errors.email = 'Indiquez votre adresse e-mail.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "Cette adresse e-mail n'est pas valide."

  if (!values.password) errors.password = 'Choisissez un mot de passe.'
  else if (values.password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`

  if (!values.consent)
    errors.consent = 'Vous devez accepter la politique de confidentialité pour créer un compte.'

  return errors
}

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    email: '',
    password: '',
    full_name: '',
    country: '',
    consent: false,
  })
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      const { country, ...registration } = values
      await signUp({ ...registration, email: values.email.trim().toLowerCase() })
      // Le pays n'est pas un champ d'inscription côté serveur (il vit sur le
      // profil, pas sur le compte) : on l'enregistre juste après, maintenant
      // que la session existe. Facultatif : une erreur ici n'empêche pas la
      // création du compte, qui a déjà réussi.
      if (country) {
        try {
          await updateMe({ country })
        } catch {
          // Pas bloquant : on pourra le renseigner depuis « Mon profil ».
        }
      }
      navigate('/tableau-de-bord', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        // Erreurs serveur affichées champ par champ.
        setErrors({
          email:
            error.code === 'email_already_used'
              ? 'Cette adresse e-mail est déjà utilisée.'
              : error.fieldError('email'),
          password: error.fieldError('password'),
          full_name: error.fieldError('full_name'),
          consent: error.fieldError('consent'),
          form: error.status === 429 ? error.message : undefined,
        })
      } else {
        setErrors({ form: 'Impossible de contacter le serveur. Réessayez dans un instant.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="mb-1 text-3xl font-bold tracking-tight text-ink-900">Créer un compte</h1>
      <p className="mb-6 text-sm text-ink-600">
        Rejoignez les développeuses et développeurs d'Afrique qui échangent leurs compétences.
      </p>

      <Card className="border-accent-300/40 p-6 shadow-glow-soft sm:p-8">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <Field
            label="Nom complet"
            name="full_name"
            autoComplete="name"
            hint="Affiché sur votre profil et vos échanges."
            value={values.full_name}
            error={errors.full_name}
            onChange={(event) => setValues({ ...values, full_name: event.target.value })}
          />
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
            autoComplete="new-password"
            value={values.password}
            error={errors.password}
            hint={`${MIN_PASSWORD_LENGTH} caractères minimum. Ni trop courant, ni uniquement des chiffres.`}
            onChange={(event) => setValues({ ...values, password: event.target.value })}
          />
          <CountrySelect
            value={values.country}
            onChange={(country) => setValues({ ...values, country })}
          />

          <div className="flex flex-col gap-1.5 border-t border-ink-200 pt-5">
            <label className="flex items-start gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                name="consent"
                checked={values.consent}
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? 'consent-error' : undefined}
                onChange={(event) => setValues({ ...values, consent: event.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-ink-300 text-accent-600"
              />
              <span>
                J'accepte la{' '}
                <Link to="/confidentialite" className="underline hover:text-accent-700">
                  politique de confidentialité
                </Link>
                .
              </span>
            </label>
            {errors.consent && (
              <p id="consent-error" className="text-sm text-red-400">
                {errors.consent}
              </p>
            )}
          </div>

          {errors.form && (
            <p role="alert" className="text-sm text-red-400">
              {errors.form}
            </p>
          )}

          <Button type="submit" loading={submitting} className="w-full">
            Créer mon compte
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-ink-600">
        Vous avez déjà un compte ?{' '}
        <Link to="/connexion" className="font-medium text-accent-700 underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
