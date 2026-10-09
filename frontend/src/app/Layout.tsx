import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icon from '../components/icons/Icon'
import Logo from '../components/icons/Logo'
import PageContainer from '../components/PageContainer'
import CopilotWidget from '../features/ai/components/CopilotWidget'
import { useAuth } from '../features/auth/hooks/useAuth'
import { usePendingRequests } from '../features/exchanges/hooks/usePendingRequests'
import { cn } from '../lib/cn'

interface NavLinkItem {
  to: string
  label: string
}

const PRIVATE_LINKS: NavLinkItem[] = [
  { to: '/tableau-de-bord', label: 'Tableau de bord' },
  { to: '/competences', label: 'Compétences' },
  { to: '/matchs', label: 'Matchs' },
  { to: '/echanges', label: 'Échanges' },
]

/** Pastille du nombre de demandes reçues, posée à côté du lien « Échanges ». */
function PendingBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[#1f6feb] px-1.5 text-xs font-semibold leading-5 text-white">
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{` (${count} demande${count > 1 ? 's' : ''} en attente)`}</span>
    </span>
  )
}

const PUBLIC_LINKS: NavLinkItem[] = [
  { to: '/recherche', label: 'Recherche' },
  { to: '/projets', label: 'Projets' },
  { to: '/pays', label: 'Pays' },
]

// La barre est claire (pastille flottante sur le fond sombre) : ses couleurs
// sont posées en dur plutôt qu'avec `ink`, dont l'échelle est pensée pour un
// fond sombre et donnerait ici du texte clair sur du clair.
const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center whitespace-nowrap rounded-lg px-3 py-2 text-[15px] font-medium transition-colors',
    isActive ? 'text-[#0d1117] bg-[#dde1e7]' : 'text-[#3d444d] hover:text-[#0d1117]',
  )

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'block rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors',
    isActive ? 'text-[#0d1117] bg-[#dde1e7]' : 'text-[#3d444d] hover:bg-[#e3e6eb]',
  )

const signUpClass =
  'inline-flex items-center justify-center rounded-xl bg-[#1a6fe0] px-7 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#155fc4]'

export default function Layout() {
  const { isAuthenticated, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const pending = usePendingRequests(isAuthenticated)

  const links = isAuthenticated ? [...PRIVATE_LINKS, ...PUBLIC_LINKS] : PUBLIC_LINKS
  // Connecté, la barre porte sept liens plus le profil : elle ne tient sur
  // une ligne qu'à partir de xl. En visiteur, trois liens tiennent dès lg.
  const desktop = isAuthenticated ? 'xl:flex' : 'lg:flex'
  const mobileOnly = isAuthenticated ? 'xl:hidden' : 'lg:hidden'

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink-100 focus:px-3 focus:py-2 focus:shadow-card"
      >
        Aller au contenu
      </a>

      {/* Pastille flottante, collée en haut au défilement : le contenu passe
          dessous, visible dans la marge autour de la barre. */}
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
        <div className="mx-auto max-w-[90rem] rounded-2xl bg-[#f0f2f5]/95 shadow-card backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
            <Link to="/" className="shrink-0 text-[#0d1117]" aria-label="DevLink Africa, accueil">
              <Logo size={26} variant="light" />
            </Link>

            <nav
              aria-label="Navigation principale"
              className={cn('hidden flex-1 items-center justify-center gap-1', desktop)}
            >
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} className={linkClass}>
                  {link.label}
                  {link.to === '/echanges' && <PendingBadge count={pending} />}
                </NavLink>
              ))}
            </nav>

            <div className={cn('hidden shrink-0 items-center gap-2', desktop)}>
              {isAuthenticated ? (
                <>
                  <NavLink to="/profil" className={linkClass}>
                    <Icon name="profile" size={17} className="mr-2" />
                    {user?.full_name || 'Mon profil'}
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    aria-label="Se déconnecter"
                    title="Se déconnecter"
                    className="rounded-xl border border-[#d0d7de] p-2.5 text-[#3d444d] transition-colors hover:bg-[#e3e6eb] hover:text-[#0d1117]"
                  >
                    <Icon name="logout" size={18} />
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/connexion" className={linkClass}>
                    Se connecter
                  </NavLink>
                  <Link to="/inscription" className={signUpClass}>
                    S’inscrire
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              aria-label="Menu"
              className={cn('ml-auto rounded-lg p-2 text-[#3d444d] hover:bg-[#e3e6eb]', mobileOnly)}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
              >
                <path strokeWidth="2" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>

          {menuOpen && (
            <nav
              id="menu-mobile"
              aria-label="Navigation mobile"
              className={cn('animate-fade-in border-t border-[#d0d7de] px-3 py-2', mobileOnly)}
            >
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={mobileLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                  {link.to === '/echanges' && <PendingBadge count={pending} />}
                </NavLink>
              ))}
              <div className="mt-2 border-t border-[#d0d7de] pt-2">
                {isAuthenticated ? (
                  <>
                    <NavLink
                      to="/profil"
                      className={mobileLinkClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      Mon profil
                    </NavLink>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-[#3d444d] hover:bg-[#e3e6eb]"
                    >
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <NavLink
                      to="/connexion"
                      className={mobileLinkClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      Se connecter
                    </NavLink>
                    <Link
                      to="/inscription"
                      className={signUpClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      S’inscrire
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Plus de max-w ici : chaque page décide de sa propre largeur via
          PageContainer, pour pouvoir poser des sections pleine largeur
          (bannière, fond de section) sans que ça devienne la norme partout. */}
      <main id="contenu" className="flex-1 bg-ink-50">
        <Outlet />
      </main>

      <footer className="border-t border-ink-200 bg-ink-100">
        <PageContainer className="flex flex-col items-center gap-2 py-6 text-sm text-ink-600 sm:flex-row sm:justify-between">
          <p>DevLink Africa — échange de compétences entre développeurs africains.</p>
          <nav aria-label="Liens secondaires" className="flex gap-4">
            <Link to="/confidentialite" className="underline hover:text-accent-700">
              Confidentialité
            </Link>
            <Link to="/design" className="underline hover:text-accent-700">
              Design system
            </Link>
          </nav>
        </PageContainer>
      </footer>

      <CopilotWidget />
    </div>
  )
}
