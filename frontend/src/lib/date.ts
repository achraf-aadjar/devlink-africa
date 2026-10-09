const RELATIVE = {
  fr: {
    today: "aujourd'hui",
    yesterday: 'hier',
    days: (n: number) => `il y a ${n} jours`,
    weeks: (n: number) => `il y a ${n} semaine${n > 1 ? 's' : ''}`,
    locale: 'fr-FR',
  },
  en: {
    today: 'today',
    yesterday: 'yesterday',
    days: (n: number) => `${n} days ago`,
    weeks: (n: number) => `${n} week${n > 1 ? 's' : ''} ago`,
    locale: 'en-GB',
  },
} as const

/** Date courte et relative (« il y a 3 jours », « 3 days ago ») : métadonnées de projet. */
export function formatRelativeDate(iso: string, lang: 'fr' | 'en' = 'fr'): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  const text = RELATIVE[lang]

  if (days <= 0) return text.today
  if (days === 1) return text.yesterday
  if (days < 7) return text.days(days)
  if (days < 30) return text.weeks(Math.floor(days / 7))

  return new Intl.DateTimeFormat(text.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** Hôte + chemin court d'une URL, pour afficher "github.com/org/projet" plutôt que l'URL complète. */
export function shortenUrl(url: string): string {
  try {
    const { host, pathname } = new URL(url)
    const path = pathname.replace(/\/+$/, '')
    return `${host}${path}`
  } catch {
    return url
  }
}
