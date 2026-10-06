import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithRouter } from '../../../test/helpers'
import ProfilePage from './ProfilePage'

const ME = {
  id: 1,
  email: 'ada@example.org',
  full_name: 'Ada Lovelace',
  date_joined: '2026-10-07T00:00:00Z',
  profile: {
    country: 'SN',
    bio: 'Développeuse web à Dakar.',
    availability: ['MENTORING'],
    domains: ['WEB'],
    avatar_url: '',
    is_demo: false,
    completeness: 80,
  },
}

const COUNTRIES = {
  results: [
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
    { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  ],
}

function stub(patchResponse?: Response) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = String(url)
    if (init?.method === 'PATCH') {
      return Promise.resolve(patchResponse ?? jsonResponse(ME))
    }
    if (path.includes('/countries/all/')) return Promise.resolve(jsonResponse(COUNTRIES))
    return Promise.resolve(jsonResponse(ME))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('mon profil', () => {
  it('pré-remplit le formulaire et montre la complétude', async () => {
    stub()
    renderWithRouter(<ProfilePage />, { authenticated: true })

    expect(await screen.findByDisplayValue('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Développeuse web à Dakar.')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('ada@example.org')).toBeInTheDocument()
  })

  it('coche les disponibilités déjà déclarées', async () => {
    stub()
    renderWithRouter(<ProfilePage />, { authenticated: true })

    expect(await screen.findByRole('checkbox', { name: 'Mentorat' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Freelance' })).not.toBeChecked()
  })

  it('enregistre les modifications', async () => {
    const fetchMock = stub()
    renderWithRouter(<ProfilePage />, { authenticated: true })
    await screen.findByDisplayValue('Ada Lovelace')

    await userEvent.click(screen.getByRole('checkbox', { name: 'Freelance' }))
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/enregistré/))
    const patched = fetchMock.mock.calls.find((call) => call[1]?.method === 'PATCH')
    expect(JSON.parse(patched?.[1]?.body as string).availability).toEqual([
      'MENTORING',
      'FREELANCE',
    ])
  })

  it('affiche les erreurs du serveur champ par champ', async () => {
    stub(
      jsonResponse(
        {
          detail: 'Invalide.',
          code: 'invalid',
          errors: { avatar_url: ["L'adresse doit commencer par https://."] },
        },
        400,
      ),
    )
    renderWithRouter(<ProfilePage />, { authenticated: true })
    await screen.findByDisplayValue('Ada Lovelace')

    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByText("L'adresse doit commencer par https://.")).toBeInTheDocument()
  })

  it('compte les caractères de la présentation', async () => {
    stub()
    renderWithRouter(<ProfilePage />, { authenticated: true })

    expect(await screen.findByText(/25 \/ 1000 caractères/)).toBeInTheDocument()
  })
})
