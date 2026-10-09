import { useEffect, useRef, useState } from 'react'
import Icon from '../../../components/icons/Icon'
import { Button, Spinner } from '../../../components/ui'
import { msg } from '../../../i18n/translate'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import { useAuth } from '../../auth/hooks/useAuth'
import { copilotReply, type CopilotTurn } from '../api/ai'
import { useAIStatus } from '../hooks/useAIStatus'

const MAX_HISTORY_SENT = 6
const WELCOME = msg(
  'Bonjour ! Je suis DevLink Copilot. Posez-moi une question sur votre profil, vos compétences, les matchs ou les échanges.',
)

interface Message extends CopilotTurn {
  id: number
  failed?: boolean
}

/**
 * DevLink Copilot : assistant flottant qui aide à utiliser la plateforme.
 *
 * Purement conversationnel — il ne remplit aucun formulaire à la place de la
 * personne, il explique et oriente (voir ai/services.py:copilot_reply). Comme
 * les autres fonctions d'IA, invisible tant que l'IA n'est pas active
 * (`useAIStatus`) : pas de bulle qui ne peut que décevoir.
 */
export default function CopilotWidget() {
  const { t } = useI18n()
  const { enabled } = useAIStatus()
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(0)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, open])

  if (!enabled || !isAuthenticated) return null

  async function send(event: React.FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sending) return

    const userMessage: Message = { id: nextId.current++, role: 'user', content: text }
    const history = messages.slice(-MAX_HISTORY_SENT).map(({ role, content }) => ({
      role,
      content,
    }))
    setMessages((list) => [...list, userMessage])
    setDraft('')
    setSending(true)

    try {
      const { reply } = await copilotReply(text, history)
      setMessages((list) => [...list, { id: nextId.current++, role: 'assistant', content: reply }])
    } catch (cause) {
      const message =
        cause instanceof ApiError && cause.status === 503
          ? t('DevLink Copilot est momentanément indisponible. Réessayez dans un instant.')
          : t("Je n'ai pas pu répondre. Réessayez dans un instant.")
      setMessages((list) => [
        ...list,
        { id: nextId.current++, role: 'assistant', content: message, failed: true },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div
          role="dialog"
          aria-label="DevLink Copilot"
          className="flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-card border border-ink-200 bg-ink-100 shadow-card"
        >
          <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Icon name="discussion" size={18} className="text-accent-600" />
              <h2 className="text-sm font-semibold text-ink-900">DevLink Copilot</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('Fermer DevLink Copilot')}
              className="rounded p-1 text-ink-500 hover:bg-ink-200 hover:text-ink-800"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3">
            <p className="mb-3 text-sm text-ink-600">{t(WELCOME)}</p>
            <ul className="flex flex-col gap-2">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <p
                    className={
                      message.role === 'user'
                        ? 'max-w-[85%] rounded-card bg-accent-400 px-3 py-2 text-sm text-white'
                        : message.failed
                          ? 'max-w-[85%] rounded-card bg-ink-50 px-3 py-2 text-sm text-ink-600'
                          : 'max-w-[85%] rounded-card bg-ink-50 px-3 py-2 text-sm text-ink-800'
                    }
                  >
                    {message.content}
                  </p>
                </li>
              ))}
              {sending && (
                <li className="flex justify-start">
                  <span className="flex items-center gap-2 rounded-card bg-ink-50 px-3 py-2 text-sm text-ink-600">
                    <Spinner className="h-4 w-4" /> {t('DevLink Copilot réfléchit…')}
                  </span>
                </li>
              )}
            </ul>
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-ink-200 p-3">
            <label htmlFor="copilot-input" className="sr-only">
              {t('Votre question pour DevLink Copilot')}
            </label>
            <input
              id="copilot-input"
              type="text"
              value={draft}
              maxLength={1000}
              placeholder={t('Posez votre question…')}
              onChange={(event) => setDraft(event.target.value)}
              className="flex-1 rounded-lg border border-ink-300 bg-ink-100 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400"
            />
            <Button type="submit" size="sm" loading={sending} disabled={!draft.trim()}>
              {t('Envoyer')}
            </Button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? t('Réduire DevLink Copilot') : t('Ouvrir DevLink Copilot')}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-400 text-white shadow-card transition-colors hover:bg-accent-300"
      >
        <Icon name={open ? 'close' : 'discussion'} size={24} />
      </button>
    </div>
  )
}
