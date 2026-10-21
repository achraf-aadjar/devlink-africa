import Icon from './icons/Icon'
import { useI18n } from '../i18n/useI18n'
import { cn } from '../lib/cn'
import { useTheme } from '../theme/useTheme'

const TONES = {
  // Barre de navigation sombre (toujours sombre, même en thème clair).
  bar: 'rounded-md text-bar-muted hover:bg-white/10 hover:text-white',
  // Fond ordinaire de page, qui suit le thème clair/sombre.
  ink: 'rounded-lg text-ink-700 hover:bg-ink-200 hover:text-ink-900',
}

/** Bascule clair ↔ sombre : affiche le thème vers lequel on passe. */
export default function ThemeSwitch({
  tone = 'bar',
  className,
}: {
  tone?: keyof typeof TONES
  className?: string
}) {
  const { theme, toggleTheme } = useTheme()
  const { t } = useI18n()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={next === 'dark' ? t('Passer au thème sombre') : t('Passer au thème clair')}
      title={next === 'dark' ? t('Thème sombre') : t('Thème clair')}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center transition-colors',
        TONES[tone],
        className,
      )}
    >
      <Icon name={next === 'dark' ? 'moon' : 'sun'} size={18} />
    </button>
  )
}
