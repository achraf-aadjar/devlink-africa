import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { routeFetch } from '../../../test/helpers'
import ForgotPasswordPage from './ForgotPasswordPage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/mot-de-passe/oublie']}>
      <ForgotPasswordPage />
    </MemoryRouter>,
  )
}

describe('page mot de passe oublié', () => {
  it('exige une adresse avant tout appel réseau', async () => {
    const fetchMock = routeFetch({})
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }))

    expect(await screen.findByText('Indiquez votre adresse e-mail.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('envoie la demande puis affiche un message neutre', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'Ada@Example.org')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }))

    expect(await screen.findByRole('status')).toHaveTextContent(/Si un compte existe/)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/auth/password-reset/')
    expect(JSON.parse(init.body)).toEqual({ email: 'ada@example.org' })
  })
})
