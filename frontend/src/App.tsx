import AuthProvider from './app/AuthProvider'
import AppRoutes from './app/routes'
import I18nProvider from './i18n/I18nProvider'
import ThemeProvider from './theme/ThemeProvider'

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
