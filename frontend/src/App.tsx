import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import SkillsPage from './pages/SkillsPage'
import MatchesPage from './pages/MatchesPage'
import MatchDetailPage from './pages/MatchDetailPage'
import SearchPage from './pages/SearchPage'
import ProjectsPage from './pages/ProjectsPage'
import ExchangesPage from './pages/ExchangesPage'
import DashboardPage from './pages/DashboardPage'
import PrivacyPage from './pages/PrivacyPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="inscription" element={<RegisterPage />} />
        <Route path="connexion" element={<LoginPage />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="competences" element={<SkillsPage />} />
        <Route path="matchs" element={<MatchesPage />} />
        <Route path="matchs/:id" element={<MatchDetailPage />} />
        <Route path="recherche" element={<SearchPage />} />
        <Route path="projets" element={<ProjectsPage />} />
        <Route path="echanges" element={<ExchangesPage />} />
        <Route path="tableau-de-bord" element={<DashboardPage />} />
        <Route path="confidentialite" element={<PrivacyPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  )
}
