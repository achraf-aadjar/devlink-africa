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
    <div className="fixed bottom-0 right-5 z-40 flex flex-col items-end">
      {open && (
        <div
          role="dialog"
          aria-label="DevLink Copilot"
          className="flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-t border border-ink-300 bg-ink-100 shadow-menu"
        >
          <div className="flex items-center justify-between border-b border-[#23598a] bg-[#2c6aa3] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Icon name="discussion" size={18} className="text-white" />
              <h2 className="text-sm font-bold text-white">DevLink Copilot</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('Fermer DevLink Copilot')}
              className="p-1 text-[#dce9f5] hover:text-white"
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
                        ? 'max-w-[85%] rounded bg-accent-400 px-3 py-2 text-sm text-white'
                        : message.failed
                          ? 'max-w-[85%] rounded border border-ink-200 bg-white px-3 py-2 text-sm text-ink-600'
                          : 'max-w-[85%] rounded border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800'
                    }
                  >
                    {message.content}
                  </p>
                </li>
              ))}
              {sending && (
                <li className="flex justify-start">
                  <span className="flex items-center gap-2 rounded border border-ink-200 bg-white px-3 py-2 text-sm text-ink-600">
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
              className="field flex-1 border-ink-300 text-sm placeholder:text-ink-400"
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
        className="flex items-center gap-2 rounded-t border border-b-0 border-[#23598a] bg-[#2c6aa3] px-4 py-2 text-sm font-bold text-white hover:bg-[#245787]"
      >
        <Icon name="discussion" size={16} />
        DevLink Copilot
      </button>
    </div>
  )
}
