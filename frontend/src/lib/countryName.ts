/**
 * Nom d'un pays dans la langue de l'interface, à partir de son code ISO.
 *
 * L'API renvoie les noms en français quand elle les connaît ; certaines routes
 * ne renvoient que le code. Le navigateur fournit le nom dans chaque langue
 * (`Intl.DisplayNames`), sans dictionnaire de 54 pays à maintenir.
 */
export function localCountryName(code: string, frenchName: string, lang: 'fr' | 'en'): string {
  const known = frenchName && frenchName.toUpperCase() !== code.toUpperCase()
  if (!code || (lang === 'fr' && known)) return frenchName
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code.toUpperCase()) ?? frenchName
  } catch {
    return frenchName
  }
}
