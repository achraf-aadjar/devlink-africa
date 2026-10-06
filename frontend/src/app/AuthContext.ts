import { createContext } from 'react'
import type { User } from '../lib/types'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  /** true le temps de restaurer la session au chargement de l'application. */
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: {
    email: string
    password: string
    full_name: string
    consent: boolean
  }) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
