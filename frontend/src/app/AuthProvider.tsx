import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../features/auth/api/auth'
import { api } from '../lib/api'
import { getAccessToken, getRefreshToken, setTokens } from '../lib/token'
import type { User } from '../lib/types'
import { AuthContext, type AuthState } from './AuthContext'

/**
 * Fournit la session à toute l'application.
 *
 * Au chargement, si un jeton est présent, on vérifie qu'il est encore valide en
 * demandant /me/. Le profil complet est chargé par les écrans qui en ont besoin.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function restore() {
      if (!getAccessToken() && !getRefreshToken()) {
        setIsLoading(false)
        return
      }
      try {
        const me = await api.get<User>('/me/')
        if (!cancelled) setUser(me)
      } catch {
        // Jeton expiré ou révoqué : on repart d'une session vide.
        setTokens(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void restore()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login({ email, password })
    setTokens(tokens)
    setUser(tokens.user)
  }, [])

  const signUp = useCallback(async (input: authApi.RegisterInput) => {
    const tokens = await authApi.register(input)
    setTokens(tokens)
    setUser(tokens.user)
  }, [])

  const signInWithGoogle = useCallback(async (credential: string) => {
    const tokens = await authApi.googleSignIn(credential)
    setTokens(tokens)
    setUser(tokens.user)
  }, [])

  const signOut = useCallback(async () => {
    const refresh = getRefreshToken()
    try {
      if (refresh) await authApi.logout(refresh)
    } catch {
      // Jeton déjà révoqué côté serveur : la déconnexion locale suffit.
    } finally {
      setTokens(null)
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [user, isLoading, signIn, signUp, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
