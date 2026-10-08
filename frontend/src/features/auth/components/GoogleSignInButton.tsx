import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useGoogleClientId } from '../hooks/useGoogleClientId'

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('google_script_error')), {
        once: true,
      })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('google_script_error'))
    document.head.appendChild(script)
  })
}

/**
 * Bouton « Continuer avec Google » (inscription et connexion confondues : le
 * serveur crée le compte s'il n'existe pas encore, voir docs/api.md § 3).
 *
 * Invisible tant qu'aucun identifiant client n'est configuré côté serveur —
 * même principe que les fonctions d'IA (`useAIStatus`) : pas de bouton qui ne
 * peut qu'échouer.
 */
export default function GoogleSignInButton({
  redirectTo = '/tableau-de-bord',
  onError,
}: {
  redirectTo?: string
  onError: (message: string) => void
}) {
  const { clientId, loading } = useGoogleClientId()
  const { signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

  // Référence stable : l'effet ne doit se relancer que si l'identifiant
  // client change, pas à chaque rendu du parent (voir Modal.tsx pour le même
  // principe).
  const latest = useRef({ signInWithGoogle, navigate, onError, redirectTo })
  useEffect(() => {
    latest.current = { signInWithGoogle, navigate, onError, redirectTo }
  })

  useEffect(() => {
    if (!clientId) return
    let cancelled = false

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            void (async () => {
              try {
                await latest.current.signInWithGoogle(response.credential)
                latest.current.navigate(latest.current.redirectTo, { replace: true })
              } catch {
                latest.current.onError('La connexion avec Google a échoué. Réessayez.')
              }
            })()
          },
        })
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          locale: 'fr',
        })
      })
      .catch(() => {
        if (!cancelled) latest.current.onError("Le bouton Google n'a pas pu être chargé.")
      })

    return () => {
      cancelled = true
    }
  }, [clientId])

  if (loading || !clientId) return null

  return <div ref={containerRef} className="flex justify-center" />
}
