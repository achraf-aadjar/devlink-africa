import { Outlet, useLocation } from 'react-router-dom'
import PageContainer from '../components/PageContainer'

/**
 * Fond commun des pages intérieures : la même grille estompée et le même halo
 * bleu que la bannière d'accueil, en plus discret, pour que tout le site parle
 * la même langue visuelle.
 *
 * Le contenu est remonté à chaque changement d'adresse (`key`) : c'est ce qui
 * rejoue la petite animation d'entrée d'une page à l'autre.
 */
export default function PageShell({ size }: { size: 'default' | 'wide' }) {
  const { pathname } = useLocation()

  return (
    <div className="relative isolate">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80">
        <div className="bg-aurora absolute inset-0" />
        <div className="glow-blob inset-x-0 -top-40 mx-auto h-72 w-[42rem] max-w-full bg-[#1f6feb]/20" />
      </div>
      <PageContainer size={size} className="py-10">
        <div key={pathname} className="animate-page-in">
          <Outlet />
        </div>
      </PageContainer>
    </div>
  )
}
