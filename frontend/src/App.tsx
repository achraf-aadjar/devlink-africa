import AuthProvider from './app/AuthProvider'
import AppRoutes from './app/routes'
import I18nProvider from './i18n/I18nProvider'

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </I18nProvider>
  )
}
