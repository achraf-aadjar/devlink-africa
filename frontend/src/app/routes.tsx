import { Route, Routes } from 'react-router-dom'
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import CountriesPage from '../features/countries/pages/CountriesPage'
import CountryDetailPage from '../features/countries/pages/CountryDetailPage'
import DashboardPage from '../features/dashboard/pages/DashboardPage'
import ExchangesPage from '../features/exchanges/pages/ExchangesPage'
import MatchDetailPage from '../features/matches/pages/MatchDetailPage'
import MatchesPage from '../features/matches/pages/MatchesPage'
import ProfilePage from '../features/profile/pages/ProfilePage'
import PublicProfilePage from '../features/profile/pages/PublicProfilePage'
import ProjectDetailPage from '../features/projects/pages/ProjectDetailPage'
import ProjectFormPage from '../features/projects/pages/ProjectFormPage'
import ProjectsPage from '../features/projects/pages/ProjectsPage'
import SearchPage from '../features/search/pages/SearchPage'
import SkillsPage from '../features/skills/pages/SkillsPage'
import DesignSystemPage from '../pages/DesignSystemPage'
import HomePage from '../pages/HomePage'
import NotFoundPage from '../pages/NotFoundPage'
import PrivacyPage from '../pages/PrivacyPage'
import Layout from './Layout'
import RequireAuth from './RequireAuth'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Routes publiques */}
        <Route index element={<HomePage />} />
        <Route path="inscription" element={<RegisterPage />} />
        <Route path="connexion" element={<LoginPage />} />
        <Route path="confidentialite" element={<PrivacyPage />} />
        <Route path="design" element={<DesignSystemPage />} />
        <Route path="recherche" element={<SearchPage />} />
        <Route path="developpeurs/:id" element={<PublicProfilePage />} />
        <Route path="pays" element={<CountriesPage />} />
        <Route path="pays/:code" element={<CountryDetailPage />} />
        <Route path="projets" element={<ProjectsPage />} />

        {/* Routes privées */}
        <Route element={<RequireAuth />}>
          <Route path="tableau-de-bord" element={<DashboardPage />} />
          <Route path="profil" element={<ProfilePage />} />
          <Route path="competences" element={<SkillsPage />} />
          <Route path="matchs" element={<MatchesPage />} />
          <Route path="matchs/:id" element={<MatchDetailPage />} />
          <Route path="echanges" element={<ExchangesPage />} />
          <Route path="projets/nouveau" element={<ProjectFormPage />} />
          <Route path="projets/:id/modifier" element={<ProjectFormPage />} />
        </Route>

        {/* Après les routes privées : « nouveau » ne doit pas être lu comme un identifiant. */}
        <Route path="projets/:id" element={<ProjectDetailPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
