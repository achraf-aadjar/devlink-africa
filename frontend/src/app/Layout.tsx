import { Suspense, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icon from '../components/icons/Icon'
import Logo from '../components/icons/Logo'
import PageContainer from '../components/PageContainer'
import Spinner from '../components/ui/Spinner'
import CopilotWidget from '../features/ai/components/CopilotWidget'
import { useAuth } from '../features/auth/hooks/useAuth'
import { usePendingCircles } from '../features/circles/hooks/usePendingCircles'
import { usePendingRequests } from '../features/exchanges/hooks/usePendingRequests'
import { msg } from '../i18n/translate'
import { useI18n } from '../i18n/useI18n'
import { cn } from '../lib/cn'
import { useTheme } from '../theme/useTheme'

interface NavLinkItem {
  to: string
  label: string
}

const PRIVATE_LINKS: NavLinkItem[] = [
  { to: '/tableau-de-bord', label: msg('Tableau de bord') },
  { to: '/competences', label: msg('Compétences') },
  { to: '/matchs', label: msg('Matchs') },
  { to: '/cercles', label: msg('Cercles') },
  { to: '/echanges', label: msg('Échanges') },
]

/**
 * Pastille d'un compteur posée à côté d'un lien : demandes d'échange reçues,
 * invitations dans un cercle.
 */
function PendingBadge({ count, kind = 'request' }: { count: number; kind?: 'request' | 'invite' }) {
  const { t } = useI18n()
  if (count === 0) return null
  const label =
    kind === 'invite'
      ? count > 1
        ? t('{count} invitations en attente', { count })
        : t('{count} invitation en attente', { count })
      : count > 1
        ? t('{count} demandes en attente', { count })
        : t('{count} demande en attente', { count })
  return (
    <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded bg-demand-fill px-1.5 font-display text-sm font-bold leading-5 text-white tabular-nums">
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{` (${label})`}</span>
    </span>
  )
}

/** Bascule français ↔ anglais : affiche la langue vers laquelle on passe. */
function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n()
  const next = lang === 'fr' ? 'en' : 'fr'
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      // Annoncé dans la langue proposée, comme le font les sites bilingues.
      lang={next}
      aria-label={next === 'en' ? 'Switch to English' : t('Passer en français')}
      title={next === 'en' ? 'English' : 'Français'}
      className={cn(
        'inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-md px-2.5 font-display text-base font-bold tracking-wide text-bar-muted transition-colors hover:bg-white/10 hover:text-white',
        className,
      )}
    >
      <span aria-hidden="true">{next.toUpperCase()}</span>
    </button>
  )
}

/** Bascule clair ↔ sombre : affiche le thème vers lequel on passe. */
function ThemeSwitch({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const { t } = useI18n()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={next === 'dark' ? t('Passer au thème sombre') : t('Passer au thème clair')}
      title={next === 'dark' ? t('Thème sombre') : t('Thème clair')}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-bar-muted transition-colors hover:bg-white/10 hover:text-white',
        className,
      )}
    >
      <Icon name={next === 'dark' ? 'moon' : 'sun'} size={18} />
    </button>
  )
}

const PUBLIC_LINKS: NavLinkItem[] = [
  { to: '/recherche', label: msg('Recherche') },
  { to: '/projets', label: msg('Projets') },
]

// Un visiteur a la place de voir aussi les pays et l'observatoire. Connecté,
// la barre garde ses sept liens de travail : pays et observatoire restent
// joignables par le pied de page.
const VISITOR_LINKS: NavLinkItem[] = [
  { to: '/pays', label: msg('Pays|menu') },
  { to: '/observatoire', label: msg('Observatoire') },
]

// La barre est noire dans les deux thèmes (le tableau d'affichage) : ses
// couleurs viennent de `bar`, pas de l'échelle `ink` qui change avec le thème.
// Le lien actif est souligné d'un trait bleu clair, comme la ligne en cours
// d'un tableau des départs.
const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative flex min-h-11 items-center whitespace-nowrap px-2.5 py-2 text-[15px] font-medium transition-colors',
    'after:absolute after:inset-x-2.5 after:-bottom-2 after:h-[3px] after:rounded-t-sm',
    isActive
      ? 'text-white after:bg-bar-accent'
      : 'text-bar-muted hover:text-white after:bg-transparent',
  )

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-11 items-center rounded-md border-l-[3px] px-3 py-2.5 text-[15px] font-medium transition-colors',
    isActive
      ? 'border-bar-accent bg-white/10 text-white'
      : 'border-transparent text-bar-muted hover:bg-white/10 hover:text-white',
  )

const signUpClass =
  'inline-flex min-h-11 items-center justify-center rounded-md bg-brand px-5 py-2 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover'

export default function Layout() {
  const { isAuthenticated, user, signOut } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const pending = usePendingRequests(isAuthenticated)
  const circleInvitations = usePendingCircles(isAuthenticated)

  const links = isAuthenticated
    ? [...PRIVATE_LINKS, ...PUBLIC_LINKS]
    : [...PUBLIC_LINKS, ...VISITOR_LINKS]
  // Connecté, la barre porte sept liens plus le profil : elle ne tient sur
  // une ligne qu'à partir de xl. En visiteur, quatre liens tiennent dès lg.
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
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink-100 focus:px-3 focus:py-2 focus:shadow-lift"
      >
        {t('Aller au contenu')}
      </a>

      {/* Barre noire collée en haut, pleine largeur : le tableau d'affichage. */}
      <header className="sticky top-0 z-40 bg-bar text-bar-text">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6">
          <div className="flex min-h-[3.75rem] items-center gap-3 py-2">
            <Link to="/" className="shrink-0 text-white" aria-label={t('DevLink Africa, accueil')}>
              <Logo size={26} variant="bar" />
            </Link>

            <nav
              aria-label={t('Navigation principale')}
              className={cn('ml-6 hidden flex-1 items-center gap-1', desktop)}
            >
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} className={linkClass}>
                  {t(link.label)}
                  {link.to === '/echanges' && <PendingBadge count={pending} />}
                  {link.to === '/cercles' && (
                    <PendingBadge count={circleInvitations} kind="invite" />
                  )}
                </NavLink>
              ))}
            </nav>

            <div className={cn('hidden shrink-0 items-center gap-2', desktop)}>
              {isAuthenticated ? (
                <>
                  <NavLink to="/profil" className={linkClass}>
                    <Icon name="profile" size={17} className="mr-2" />
                    {user?.full_name || t('Mon profil')}
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    aria-label={t('Se déconnecter')}
                    title={t('Se déconnecter')}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-md text-bar-muted transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Icon name="logout" size={18} />
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/connexion" className={linkClass}>
                    {t('Se connecter')}
                  </NavLink>
                  <Link to="/inscription" className={signUpClass}>
                    {t('S’inscrire')}
                  </Link>
                </>
              )}
            </div>

            <div
              className={cn(
                'ml-auto flex items-center gap-1',
                isAuthenticated ? 'xl:ml-0' : 'lg:ml-0',
              )}
            >
              <ThemeSwitch />
              <LanguageSwitch />
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              aria-label={t('Menu')}
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center rounded-md text-bar-text hover:bg-white/10',
                mobileOnly,
              )}
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
              aria-label={t('Navigation mobile')}
              className={cn(
                'animate-fade-in -mx-4 border-t border-bar-line px-3 pb-3 pt-2 sm:-mx-6',
                mobileOnly,
              )}
            >
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={mobileLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  {t(link.label)}
                  {link.to === '/echanges' && <PendingBadge count={pending} />}
                  {link.to === '/cercles' && (
                    <PendingBadge count={circleInvitations} kind="invite" />
                  )}
                </NavLink>
              ))}
              <div className="mt-2 border-t border-bar-line pt-2">
                {isAuthenticated ? (
                  <>
                    <NavLink
                      to="/profil"
                      className={mobileLinkClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t('Mon profil')}
                    </NavLink>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex min-h-11 w-full items-center rounded-md border-l-[3px] border-transparent px-3 py-2.5 text-left text-[15px] font-medium text-bar-muted hover:bg-white/10 hover:text-white"
                    >
                      {t('Se déconnecter')}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <NavLink
                      to="/connexion"
                      className={mobileLinkClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t('Se connecter')}
                    </NavLink>
                    <Link
                      to="/inscription"
                      className={signUpClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t('S’inscrire')}
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Chaque page décide de sa largeur via PageContainer, pour que
          l'accueil puisse poser des sections pleine largeur. */}
      <main id="contenu" className="flex-1 bg-ink-50">
        <Suspense
          fallback={
            <div
              role="status"
              className="flex items-center justify-center gap-3 py-24 text-ink-600"
            >
              <Spinner className="h-5 w-5" />
              <span>{t('Chargement…')}</span>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-ink-300 bg-ink-50">
        <PageContainer
          size="wide"
          className="flex flex-col gap-3 py-6 text-sm text-ink-600 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{t('DevLink Africa — échange de compétences entre développeurs africains.')}</p>
          <nav aria-label={t('Liens secondaires')} className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/pays" className="underline hover:text-accent-700">
              {t('Pays|menu')}
            </Link>
            <Link to="/observatoire" className="underline hover:text-accent-700">
              {t('Observatoire')}
            </Link>
            <Link to="/confidentialite" className="underline hover:text-accent-700">
              {t('Confidentialité')}
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
