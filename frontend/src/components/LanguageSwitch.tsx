import { useI18n } from '../i18n/useI18n'
import { cn } from '../lib/cn'

const TONES = {
  // Barre de navigation sombre (toujours sombre, même en thème clair).
  bar: 'rounded-md font-display text-base font-bold tracking-wide text-bar-muted hover:bg-white/10 hover:text-white',
  // Fond ordinaire de page, qui suit le thème clair/sombre.
  ink: 'rounded-lg text-sm font-semibold text-ink-700 hover:bg-ink-200 hover:text-ink-900',
}

/** Bascule français ↔ anglais : affiche la langue vers laquelle on passe. */
export default function LanguageSwitch({
  tone = 'bar',
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
        'inline-flex h-11 min-w-11 shrink-0 items-center justify-center px-2.5 transition-colors',
        TONES[tone],
        className,
      )}
    >
      <span aria-hidden="true">{next.toUpperCase()}</span>
    </button>
  )
}
