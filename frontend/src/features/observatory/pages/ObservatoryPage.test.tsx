import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithRouter } from '../../../test/helpers'
import ObservatoryPage from './ObservatoryPage'

const DATA = {
  totals: { developers: 22, countries: 17, offered: 33, wanted: 31 },
  skills: [
    { name: 'Python', category: 'BACKEND', offered: 6, wanted: 3 },
    { name: 'Kubernetes', category: 'DEVOPS', offered: 0, wanted: 1 },
  ],
  shortages: [{ name: 'Kubernetes', category: 'DEVOPS', offered: 0, wanted: 1 }],
  surpluses: [{ name: 'Python', category: 'BACKEND', offered: 6, wanted: 3 }],
  bridges: [
    {
      skill: 'Docker',
      wanted_in: { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
      offered_in: [
        { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
        { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
      ],
    },
  ],
}

function stub(body: unknown = DATA) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(body)))
}

describe('observatoire des compétences', () => {
  it('affiche les chiffres clés', async () => {
    stub()
    renderWithRouter(<ObservatoryPage />)

    expect(await screen.findByText('Développeurs inscrits')).toBeInTheDocument()
    expect(screen.getByText('22')).toBeInTheDocument()
    expect(screen.getByText('17')).toBeInTheDocument()
  })

  it('décrit chaque barre en phrase, avec les accords justes', async () => {
    stub()
    renderWithRouter(<ObservatoryPage />)

    expect(
      await screen.findByRole('listitem', {
        name: 'Python : 3 veulent l’apprendre, 6 la proposent.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('listitem', { name: 'Kubernetes : 1 veut l’apprendre, 0 la propose.' }),
    ).toBeInTheDocument()
  })

  it('montre la valeur au survol et au clavier', async () => {
    stub()
    renderWithRouter(<ObservatoryPage />)
    const row = await screen.findByRole('listitem', { name: /^Python :/ })

    await userEvent.hover(row)
    expect(within(row).getByText('Python', { selector: 'strong' })).toBeInTheDocument()

    await userEvent.unhover(row)
    expect(within(row).queryByText('Python', { selector: 'strong' })).not.toBeInTheDocument()
  })

  it('donne les données aussi en tableau', async () => {
    stub()
    renderWithRouter(<ObservatoryPage />)

    const table = await screen.findByRole('table')
    expect(within(table).getByRole('rowheader', { name: 'Python' })).toBeInTheDocument()
  })

  it('liste les manques, les savoirs à partager et les ponts entre pays', async () => {
    stub()
    renderWithRouter(<ObservatoryPage />)

    const shortages = await screen.findByRole('region', { name: 'Ce qui manque le plus' })
    expect(within(shortages).getByText('Kubernetes')).toBeInTheDocument()
    expect(within(shortages).getByText('1 veut l’apprendre · 0 la propose')).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Savoirs disponibles à partager' }),
    ).toHaveTextContent('Python')
    expect(screen.getByRole('region', { name: 'Des ponts entre pays' })).toHaveTextContent(
      'Sénégal cherche Docker',
    )
  })

  it('invite un visiteur à rejoindre l’observatoire', async () => {
    stub()
    renderWithRouter(<ObservatoryPage />)

    expect(await screen.findByRole('link', { name: 'Créez votre profil' })).toHaveAttribute(
      'href',
      '/inscription',
    )
  })

  it('s’affiche en anglais, noms de pays compris', async () => {
    stub()
    renderWithRouter(<ObservatoryPage />, { lang: 'en' })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Skills Observatory' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Registered developers')).toBeInTheDocument()
    expect(
      screen.getByRole('listitem', { name: 'Python: 3 want to learn it, 6 offer it.' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('listitem', { name: 'Kubernetes: 1 wants to learn it, 0 offer it.' }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('list', { name: 'Legend' })).getByText('Offer it'),
    ).toBeInTheDocument()
    const bridges = screen.getByRole('region', { name: 'Bridges between countries' })
    expect(bridges).toHaveTextContent('Senegal is looking for Docker')
    expect(bridges).toHaveTextContent('offered by: 🇬🇭 Ghana, 🇰🇪 Kenya')
    expect(screen.queryByText('Sénégal')).not.toBeInTheDocument()
  })

  it('reste clair quand rien n’est encore déclaré', async () => {
    stub({ ...DATA, skills: [], shortages: [], surpluses: [], bridges: [] })
    renderWithRouter(<ObservatoryPage />)

    expect(await screen.findByText("L'observatoire est encore vide")).toBeInTheDocument()
  })
})
