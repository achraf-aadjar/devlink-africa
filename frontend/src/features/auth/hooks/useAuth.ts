import { useContext } from 'react'
import { AuthContext, type AuthState } from '../../../app/AuthContext'

/** Accès à la session courante. À utiliser dans les composants. */
export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth doit être utilisé dans <AuthProvider>.')
  return context
}
