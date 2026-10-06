import { Route, Routes } from 'react-router-dom'
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import DesignSystemPage from '../pages/DesignSystemPage'
import ExchangesPage from '../pages/ExchangesPage'
import HomePage from '../pages/HomePage'
import MatchDetailPage from '../pages/MatchDetailPage'
import MatchesPage from '../pages/MatchesPage'
import NotFoundPage from '../pages/NotFoundPage'
import PrivacyPage from '../pages/PrivacyPage'
import ProfilePage from '../pages/ProfilePage'
import ProjectsPage from '../pages/ProjectsPage'
import SearchPage from '../pages/SearchPage'
import SkillsPage from '../pages/SkillsPage'
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
        <Route path="projets" element={<ProjectsPage />} />

        {/* Routes privées : garde de routes */}
        <Route element={<RequireAuth />}>
          <Route path="tableau-de-bord" element={<DashboardPage />} />
          <Route path="profil" element={<ProfilePage />} />
          <Route path="competences" element={<SkillsPage />} />
          <Route path="matchs" element={<MatchesPage />} />
          <Route path="matchs/:id" element={<MatchDetailPage />} />
          <Route path="echanges" element={<ExchangesPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
