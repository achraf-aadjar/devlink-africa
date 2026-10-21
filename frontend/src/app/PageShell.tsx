import { Outlet } from 'react-router-dom'
import PageContainer from '../components/PageContainer'

/**
 * Fond commun des pages intérieures : le tableau, sans décor. Les pages s'y
 * posent comme des feuilles, toutes alignées sur les bords de l'en-tête.
 */
export default function PageShell({ size }: { size: 'default' | 'wide' }) {
  return (
    <PageContainer size={size} className="py-8 sm:py-10">
      <Outlet />
    </PageContainer>
  )
}
