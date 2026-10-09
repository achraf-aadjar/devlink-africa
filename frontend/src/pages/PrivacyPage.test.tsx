import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithRouter } from '../test/helpers'
import PrivacyPage from './PrivacyPage'

describe('politique de confidentialité', () => {
  it('cite la loi sénégalaise et renvoie vers Mon profil', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithRouter(<PrivacyPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Politique de confidentialité' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/loi sénégalaise n° 2008-12/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mon profil' })).toHaveAttribute('href', '/profil')
  })

  it('existe en version anglaise complète', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithRouter(<PrivacyPage />, { lang: 'en' })

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument()
    expect(screen.getByText('Last updated: October 2026.')).toBeInTheDocument()
    expect(screen.getByText(/Senegalese Law No\. 2008-12/)).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(8)
    expect(screen.getByRole('link', { name: 'My profile' })).toHaveAttribute('href', '/profil')
    expect(screen.queryByText(/Données collectées/)).not.toBeInTheDocument()
  })
})
