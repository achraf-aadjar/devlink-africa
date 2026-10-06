import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import { LoadingState } from '../components/ui'

/**
 * Garde de routes : renvoie vers la connexion si la session est absente.
 * On conserve la page demandée pour y revenir après connexion.
 */
export default function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <LoadingState rows={2} label="Vérification de votre session…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
