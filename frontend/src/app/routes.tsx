import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import AuthLayout from './AuthLayout'
import Layout from './Layout'
import RequireAuth from './RequireAuth'
import StandardPage from './StandardPage'
import WidePage from './WidePage'

const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('../features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../features/auth/pages/ResetPasswordPage'))
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage'))
const CirclesPage = lazy(() => import('../features/circles/pages/CirclesPage'))
const CountriesPage = lazy(() => import('../features/countries/pages/CountriesPage'))
const CountryDetailPage = lazy(() => import('../features/countries/pages/CountryDetailPage'))
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'))
const ExchangesPage = lazy(() => import('../features/exchanges/pages/ExchangesPage'))
const MatchDetailPage = lazy(() => import('../features/matches/pages/MatchDetailPage'))
const MatchesPage = lazy(() => import('../features/matches/pages/MatchesPage'))
const ObservatoryPage = lazy(() => import('../features/observatory/pages/ObservatoryPage'))
const ProfilePage = lazy(() => import('../features/profile/pages/ProfilePage'))
const PublicProfilePage = lazy(() => import('../features/profile/pages/PublicProfilePage'))
const ProjectDetailPage = lazy(() => import('../features/projects/pages/ProjectDetailPage'))
const ProjectFormPage = lazy(() => import('../features/projects/pages/ProjectFormPage'))
const ProjectsPage = lazy(() => import('../features/projects/pages/ProjectsPage'))
const SearchPage = lazy(() => import('../features/search/pages/SearchPage'))
const SkillsPage = lazy(() => import('../features/skills/pages/SkillsPage'))
const DesignSystemPage = lazy(() => import('../pages/DesignSystemPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
const PrivacyPage = lazy(() => import('../pages/PrivacyPage'))

export default function AppRoutes() {
  return (
    <Routes>
      {/* Authentification : sans navigation ni pied de page. */}
      <Route element={<AuthLayout />}>
        <Route path="inscription" element={<RegisterPage />} />
        <Route path="connexion" element={<LoginPage />} />
        <Route path="mot-de-passe/oublie" element={<ForgotPasswordPage />} />
        <Route path="mot-de-passe/reinitialiser" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<Layout />}>
        {/* Accueil seul : pas de largeur imposée, pour une bannière pleine largeur. */}
        <Route index element={<HomePage />} />

        {/* Pages de lecture : formulaires, détail d'un seul élément. */}
        <Route element={<StandardPage />}>
          <Route path="confidentialite" element={<PrivacyPage />} />
          <Route path="design" element={<DesignSystemPage />} />
          <Route path="developpeurs/:id" element={<PublicProfilePage />} />

          {/* Routes privées */}
          <Route element={<RequireAuth />}>
            <Route path="profil" element={<ProfilePage />} />
            <Route path="competences" element={<SkillsPage />} />
            <Route path="matchs/:id" element={<MatchDetailPage />} />
            <Route path="echanges" element={<ExchangesPage />} />
            <Route path="projets/nouveau" element={<ProjectFormPage />} />
            <Route path="projets/:id/modifier" element={<ProjectFormPage />} />
          </Route>

          {/* Après les routes privées : « nouveau » ne doit pas être lu comme un identifiant. */}
          <Route path="projets/:id" element={<ProjectDetailPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Pages à grille dense : plus de largeur pour que les cartes s'étalent
            sur grand écran au lieu de laisser deux bandes vides. */}
        <Route element={<WidePage />}>
          <Route path="recherche" element={<SearchPage />} />
          <Route path="pays" element={<CountriesPage />} />
          <Route path="pays/:code" element={<CountryDetailPage />} />
          <Route path="observatoire" element={<ObservatoryPage />} />
          <Route path="projets" element={<ProjectsPage />} />

          <Route element={<RequireAuth />}>
            <Route path="tableau-de-bord" element={<DashboardPage />} />
            <Route path="matchs" element={<MatchesPage />} />
            <Route path="cercles" element={<CirclesPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
