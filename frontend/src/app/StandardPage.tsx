import { Outlet } from 'react-router-dom'
import PageContainer from '../components/PageContainer'

/**
 * Enveloppe de route : applique la largeur de lecture standard.
 *
 * Toutes les pages sauf l'accueil passent par ici (voir routes.tsx). L'accueil
 * s'en passe pour pouvoir poser une bannière pleine largeur : c'est la seule
 * page qui a besoin de sortir de cette contrainte.
 */
export default function StandardPage() {
  return (
    <PageContainer className="py-8">
      <Outlet />
    </PageContainer>
  )
}
