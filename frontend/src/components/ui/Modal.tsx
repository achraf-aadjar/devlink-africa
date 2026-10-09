import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import Icon from '../icons/Icon'
import { useI18n } from '../../i18n/useI18n'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Fenêtre modale accessible : rôle de dialogue, fermeture par Échap, focus
 * déplacé à l'ouverture, et clic sur le fond pour fermer.
 */
export default function Modal({ open, title, onClose, children }: ModalProps) {
  const { t } = useI18n()
  const panel = useRef<HTMLDivElement>(null)
  // `onClose` est souvent une fonction anonyme, donc recréée à chaque rendu du
  // parent. On la garde dans une référence, sinon l'effet se relancerait à
  // chaque frappe et volerait le focus du champ en cours de saisie.
  const latestClose = useRef(onClose)
  useEffect(() => {
    latestClose.current = onClose
  }, [onClose])

  const close = useCallback(() => latestClose.current(), [])

  // Fermeture au clavier : installée une seule fois par ouverture.
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  // Focus déplacé à l'ouverture seulement, jamais pendant la saisie.
  useEffect(() => {
    if (open) panel.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label={t('Fermer')}
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="animate-fade-in relative w-full max-w-lg rounded-t-card bg-ink-100 p-6 shadow-glow-soft ring-1 ring-white/10 sm:rounded-card"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Fermer la fenêtre')}
            className="rounded-full p-1.5 text-ink-500 hover:bg-ink-200 hover:text-ink-800"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
