import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/competences', label: 'Compétences' },
  { to: '/matchs', label: 'Matchs' },
  { to: '/recherche', label: 'Recherche' },
  { to: '/projets', label: 'Projets' },
  { to: '/echanges', label: 'Échanges' },
  { to: '/tableau-de-bord', label: 'Tableau de bord' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
  }`

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <nav
          aria-label="Navigation principale"
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 p-3"
        >
          <span className="mr-4 text-lg font-bold">DevLink Africa</span>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          <span className="ml-auto flex gap-1">
            <NavLink to="/profil" className={linkClass}>
              Profil
            </NavLink>
            <NavLink to="/connexion" className={linkClass}>
              Connexion
            </NavLink>
            <NavLink to="/inscription" className={linkClass}>
              Inscription
            </NavLink>
          </span>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-6">
        <Outlet />
      </main>
      <footer className="border-t bg-white p-4 text-center text-sm text-slate-600">
        <NavLink to="/confidentialite" className="underline">
          Confidentialité
        </NavLink>
      </footer>
    </div>
  )
}
