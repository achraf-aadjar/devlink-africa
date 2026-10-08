import { Outlet } from 'react-router-dom'
import PageContainer from '../components/PageContainer'

/**
 * Enveloppe de route : largeur large, pour les écrans à grille dense (DL-XX :
 * recherche, pays, projets, tableau de bord, matchs). Même principe que
 * StandardPage, mais avec `size="wide"` — voir PageContainer.tsx.
 */
export default function WidePage() {
  return (
    <PageContainer size="wide" className="py-8">
      <Outlet />
    </PageContainer>
  )
}
