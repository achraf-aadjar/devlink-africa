import { useI18n } from '../i18n/useI18n'
import { cn } from '../lib/cn'

const TONES = {
  // Pastille claire flottante de la navbar (toujours claire, même en thème sombre).
  paper: 'text-paper-text hover:bg-paper-hover hover:text-paper-ink',
  // Fond ordinaire de page, qui suit le thème clair/sombre.
  ink: 'text-ink-700 hover:bg-ink-200 hover:text-ink-900',
}

/** Bascule français ↔ anglais : affiche la langue vers laquelle on passe. */
export default function LanguageSwitch({
  tone = 'paper',
  className,
}: {
  tone?: keyof typeof TONES
  className?: string
}) {
  const { lang, setLang, t } = useI18n()
  const next = lang === 'fr' ? 'en' : 'fr'
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      // Annoncé dans la langue proposée, comme le font les sites bilingues.
      lang={next}
      aria-label={next === 'en' ? 'Switch to English' : t('Passer en français')}
      title={next === 'en' ? 'English' : 'Français'}
      className={cn(
        'inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-2.5 text-sm font-semibold transition-colors',
        TONES[tone],
        className,
      )}
    >
      <span aria-hidden="true">{next.toUpperCase()}</span>
    </button>
  )
}
