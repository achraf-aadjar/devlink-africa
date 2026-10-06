/** Stockage des jetons JWT. Jamais journalisés (règle de sécurité du cahier). */

const ACCESS = 'devlink.access_token'
const REFRESH = 'devlink.refresh_token'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    // Stockage indisponible (navigation privée) : la session reste en mémoire.
  }
}

export const getAccessToken = () => read(ACCESS)
export const getRefreshToken = () => read(REFRESH)

export function setTokens(tokens: { access: string; refresh: string } | null): void {
  write(ACCESS, tokens?.access ?? null)
  write(REFRESH, tokens?.refresh ?? null)
}

export function setAccessToken(access: string): void {
  write(ACCESS, access)
}
