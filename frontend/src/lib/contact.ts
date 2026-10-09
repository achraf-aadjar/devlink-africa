/**
 * Lien vers un moyen de contact. Le backend n'accepte qu'une adresse e-mail ou
 * un lien https ; on revérifie ici avant d'en faire un lien, pour ne jamais
 * produire autre chose qu'un `mailto:` ou un `https:`.
 */
export function contactHref(contact: string): string | null {
  if (contact.startsWith('https://')) return contact
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return `mailto:${contact}`
  return null
}
