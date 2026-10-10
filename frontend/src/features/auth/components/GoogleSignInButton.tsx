import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../../i18n/useI18n'
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
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

  // Référence stable : l'effet ne doit se relancer que si l'identifiant
  // client ou la langue change, pas à chaque rendu du parent (voir Modal.tsx
  // pour le même principe).
  const latest = useRef({ signInWithGoogle, navigate, onError, redirectTo, t })
  useEffect(() => {
    latest.current = { signInWithGoogle, navigate, onError, redirectTo, t }
  })

  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    let resizeObserver: ResizeObserver | null = null

    function render() {
      const container = containerRef.current
      if (!container || !window.google) return
      // GIS ne redimensionne pas un bouton déjà dessiné : on l'efface et on le
      // redessine à la largeur actuelle (plafonnée à 400, maximum accepté).
      container.innerHTML = ''
      const width = Math.min(Math.round(container.getBoundingClientRect().width), 400)
      if (width <= 0) return
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        // Le libellé du bouton est dessiné par Google, dans la langue de l'interface.
        locale: lang,
        width,
      })
    }

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
                latest.current.onError(
                  latest.current.t('La connexion avec Google a échoué. Réessayez.'),
                )
              }
            })()
          },
        })

        render()
        // Garde le bouton pleine largeur si la fenêtre (ou la carte) change de taille.
        resizeObserver = new ResizeObserver(() => render())
        resizeObserver.observe(containerRef.current)
      })
      .catch(() => {
        if (!cancelled)
          latest.current.onError(latest.current.t("Le bouton Google n'a pas pu être chargé."))
      })

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
    }
  }, [clientId, lang])

  if (loading || !clientId) return null

  return <div ref={containerRef} className="w-full" />
}
