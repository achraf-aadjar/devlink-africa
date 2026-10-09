import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icon from '../components/icons/Icon'
import Logo, { LogoMark } from '../components/icons/Logo'
import PageContainer from '../components/PageContainer'
import CopilotWidget from '../features/ai/components/CopilotWidget'
import { useAuth } from '../features/auth/hooks/useAuth'
import { usePendingCircles } from '../features/circles/hooks/usePendingCircles'
import { usePendingRequests } from '../features/exchanges/hooks/usePendingRequests'
import { msg } from '../i18n/translate'
import { useI18n } from '../i18n/useI18n'
import { cn } from '../lib/cn'

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
    <span className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-[9px] bg-[#d26911] px-1.5 text-[11px] font-bold leading-[18px] text-white">
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{` (${label})`}</span>
    </span>
  )
}

/** Bascule français ↔ anglais : affiche, en toutes lettres, la langue proposée. */
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
      className={cn(
        'shrink-0 text-xs text-ink-600 hover:text-accent-700 hover:underline',
        className,
      )}
    >
      {next === 'en' ? 'English' : 'Français'}
    </button>
  )
}

const PUBLIC_LINKS: NavLinkItem[] = [
  { to: '/recherche', label: msg('Recherche') },
  { to: '/projets', label: msg('Projets') },
  { to: '/pays', label: msg('Pays|menu') },
]

// Connecté, la barre est pleine à 1280 px : l'observatoire reste alors joignable
// par le pied de page et la page Pays. Un visiteur, qui a la place, le voit ici.
const VISITOR_LINKS: NavLinkItem[] = [{ to: '/observatoire', label: msg('Observatoire') }]

// Onglets de la barre : le lien de la page courante est souligné en orange,
// comme les onglets d'un dépôt sur GitHub à l'époque.
const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex h-full items-center whitespace-nowrap border-b-2 px-2 pt-0.5 text-sm font-bold',
    isActive
      ? 'border-[#d26911] text-ink-900'
      : 'border-transparent text-ink-700 hover:text-accent-700',
  )

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center border-l-2 px-3 py-2 text-sm font-bold',
    isActive
      ? 'border-[#d26911] bg-white text-ink-900'
      : 'border-transparent text-ink-700 hover:bg-white',
  )

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
        {t('Aller au contenu')}
      </a>

      {/* Barre grise pleine largeur, comme sur la plupart des sites de 2014. */}
      <header className="border-b border-ink-200 bg-[#f5f5f5]">
        <PageContainer>
          <div className="flex h-[52px] items-center gap-4">
            <Link to="/" className="shrink-0" aria-label={t('DevLink Africa, accueil')}>
              <Logo size={22} variant="light" />
            </Link>

            <nav
              aria-label={t('Navigation principale')}
              className={cn('hidden h-full flex-1 items-stretch gap-1', desktop)}
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

            <div className={cn('hidden h-full shrink-0 items-center gap-3', desktop)}>
              {isAuthenticated ? (
                <>
                  <NavLink to="/profil" className={linkClass}>
                    <Icon name="profile" size={16} className="mr-1.5 text-ink-500" />
                    {user?.full_name || t('Mon profil')}
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    aria-label={t('Se déconnecter')}
                    title={t('Se déconnecter')}
                    className="btn btn-sm"
                  >
                    <Icon name="logout" size={15} />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/connexion"
                    className="text-sm font-bold text-ink-700 hover:text-accent-700"
                  >
                    {t('Se connecter')}
                  </Link>
                  <Link to="/inscription" className="btn btn-primary btn-sm">
                    {t('S’inscrire')}
                  </Link>
                </>
              )}
            </div>

            <LanguageSwitch className={cn('ml-auto', isAuthenticated ? 'xl:ml-0' : 'lg:ml-0')} />

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              aria-label={t('Menu')}
              className={cn('btn btn-sm', mobileOnly)}
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
              className={cn('-mx-4 border-t border-ink-200 pb-2 sm:-mx-6', mobileOnly)}
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
              <div className="mt-2 border-t border-ink-200 pt-2">
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
                      className="block w-full border-l-2 border-transparent px-3 py-2 text-left text-sm font-bold text-ink-700 hover:bg-white"
                    >
                      {t('Se déconnecter')}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 px-3">
                    <NavLink
                      to="/connexion"
                      className={mobileLinkClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t('Se connecter')}
                    </NavLink>
                    <Link
                      to="/inscription"
                      className="btn btn-primary"
                      onClick={() => setMenuOpen(false)}
                    >
                      {t('S’inscrire')}
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          )}
        </PageContainer>
      </header>

      {/* Plus de max-w ici : chaque page décide de sa propre largeur via
          PageContainer, pour pouvoir poser des sections pleine largeur
          (bannière, fond de section) sans que ça devienne la norme partout. */}
      <main id="contenu" className="flex-1 bg-ink-50">
        <Outlet />
      </main>

      <footer className="mt-10 border-t border-ink-200">
        <PageContainer className="flex flex-col items-center gap-3 py-8 text-xs text-ink-500 sm:flex-row sm:justify-between">
          <nav aria-label={t('Liens secondaires')} className="flex gap-4">
            <Link to="/observatoire" className="text-accent-700 hover:underline">
              {t('Observatoire')}
            </Link>
            <Link to="/confidentialite" className="text-accent-700 hover:underline">
              {t('Confidentialité')}
            </Link>
            <Link to="/design" className="text-accent-700 hover:underline">
              Design system
            </Link>
          </nav>
          <LogoMark size={22} variant="mono" className="hidden text-ink-300 sm:block" />
          <p>{t('DevLink Africa — échange de compétences entre développeurs africains.')}</p>
        </PageContainer>
      </footer>

      <CopilotWidget />
    </div>
  )
}
