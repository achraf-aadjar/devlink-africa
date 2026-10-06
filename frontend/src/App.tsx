import AuthProvider from './app/AuthProvider'
import AppRoutes from './app/routes'

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
