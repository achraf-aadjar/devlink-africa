import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icon, { type IconName } from '../components/icons/Icon'
import Logo from '../components/icons/Logo'
import PageContainer from '../components/PageContainer'
import { Button } from '../components/ui'
import { useAuth } from '../features/auth/hooks/useAuth'
import { cn } from '../lib/cn'

interface NavLinkItem {
  to: string
  label: string
  icon: IconName
}

const PRIVATE_LINKS: NavLinkItem[] = [
  { to: '/tableau-de-bord', label: 'Tableau de bord', icon: 'dashboard' },
  { to: '/competences', label: 'Compétences', icon: 'skill' },
  { to: '/matchs', label: 'Matchs', icon: 'match' },
  { to: '/echanges', label: 'Échanges', icon: 'exchange' },
]

const PUBLIC_LINKS: NavLinkItem[] = [
  { to: '/recherche', label: 'Recherche', icon: 'search' },
  { to: '/projets', label: 'Projets', icon: 'project' },
  { to: '/pays', label: 'Pays', icon: 'country' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-accent-50 text-accent-800' : 'text-ink-700 hover:bg-ink-200',
  )

export default function Layout() {
  const { isAuthenticated, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = isAuthenticated ? [...PRIVATE_LINKS, ...PUBLIC_LINKS] : PUBLIC_LINKS

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

      <header className="border-b border-ink-200 bg-ink-100">
        <PageContainer className="flex items-center gap-3 py-3">
          <Link to="/" className="text-ink-900" aria-label="DevLink Africa, accueil">
            <Logo size={26} />
          </Link>

          <nav
            aria-label="Navigation principale"
            className="ml-4 hidden items-center gap-1 md:flex"
          >
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                <Icon name={link.icon} size={17} />
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <>
                <NavLink to="/profil" className={linkClass}>
                  <Icon name="profile" size={17} />
                  {user?.full_name || 'Mon profil'}
                </NavLink>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <Icon name="logout" size={16} />
                  Se déconnecter
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/connexion" className={linkClass}>
                  Connexion
                </NavLink>
                <Link to="/inscription">
                  <Button size="sm">Créer un compte</Button>
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
            className="ml-auto rounded-lg p-2 text-ink-700 hover:bg-ink-200 md:hidden"
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
        </PageContainer>

        {menuOpen && (
          <nav
            id="menu-mobile"
            aria-label="Navigation mobile"
            className="animate-fade-in border-t border-ink-200 px-4 py-2 md:hidden"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClass}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-ink-200 pt-2">
              {isAuthenticated ? (
                <>
                  <NavLink to="/profil" className={linkClass} onClick={() => setMenuOpen(false)}>
                    Mon profil
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-700 hover:bg-ink-200"
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/connexion" className={linkClass} onClick={() => setMenuOpen(false)}>
                    Connexion
                  </NavLink>
                  <NavLink
                    to="/inscription"
                    className={linkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Créer un compte
                  </NavLink>
                </>
              )}
            </div>
          </nav>
        )}
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
    </div>
  )
}
