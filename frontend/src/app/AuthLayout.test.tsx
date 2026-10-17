import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import I18nProvider from '../i18n/I18nProvider'
import AuthLayout from './AuthLayout'

function renderAuthLayout(route = '/connexion') {
  return render(
    <I18nProvider initial="fr">
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="connexion" element={<h1>Se connecter</h1>} />
            <Route path="inscription" element={<h1>Créer un compte</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  )
}

describe('enveloppe des écrans d’authentification', () => {
  it('propose la bascule de langue et de thème sans passer par la navbar principale', async () => {
    renderAuthLayout()

    const languageButton = screen.getByRole('button', { name: 'Switch to English' })
    await userEvent.click(languageButton)

    expect(await screen.findByRole('button', { name: 'Passer en français' })).toBeInTheDocument()
    // La bascule de langue affecte aussi ce bouton : passé en anglais après le clic ci-dessus.
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })
})
