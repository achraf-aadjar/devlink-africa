/** Date courte et relative, en français : utilisée pour les métadonnées de projet. */
export function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000)

  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
  }

  return new Intl.DateTimeFormat('fr-FR', {
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
