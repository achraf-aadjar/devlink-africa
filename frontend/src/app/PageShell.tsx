import { Outlet } from 'react-router-dom'
import PageContainer from '../components/PageContainer'

/** Cadre commun des pages intérieures : largeur fixe et marges verticales. */
export default function PageShell({ size }: { size: 'default' | 'wide' }) {
  return (
    <PageContainer size={size} className="py-8">
      <Outlet />
    </PageContainer>
  )
}
