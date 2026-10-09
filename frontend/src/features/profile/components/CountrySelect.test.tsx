import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithRouter } from '../../../test/helpers'
import CountrySelect from './CountrySelect'

/** Volontairement dans le désordre : c'est le composant qui trie. */
const COUNTRIES = {
  results: [
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
    { code: 'EG', name: 'Égypte', flag: '🇪🇬' },
    { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  ],
}

async function openOptions(lang: 'fr' | 'en') {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(jsonResponse(COUNTRIES))),
  )
  renderWithRouter(<CountrySelect value="" onChange={vi.fn()} />, { lang })
  await userEvent.click(screen.getByRole('combobox'))
  const options = await screen.findAllByRole('option')
  return options.map((option) => option.textContent)
}

describe('sélecteur de pays', () => {
  it('trie les pays par leur nom français, accents compris', async () => {
    expect(await openOptions('fr')).toEqual(['🇩🇪 Allemagne', '🇪🇬 Égypte', '🇸🇳 Sénégal'])
  })

  it('nomme et trie les pays en anglais quand l interface est en anglais', async () => {
    expect(await openOptions('en')).toEqual(['🇪🇬 Egypt', '🇩🇪 Germany', '🇸🇳 Senegal'])
  })
})
