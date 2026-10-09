import { render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { api } from '../lib/api'
import I18nProvider from './I18nProvider'
import { useI18n } from './useI18n'

function Probe() {
  const { t, tn } = useI18n()
  useEffect(() => {
    void api.get('/ping/')
  }, [])
  return (
    <p>
      {t('Tableau de bord')} · {tn(3, '{n} preuve', '{n} preuves')}
    </p>
  )
}

describe('fournisseur de langue', () => {
  it('traduit et annonce la langue à l’API dès le premier appel', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })))
    vi.stubGlobal('fetch', fetchMock)

    render(
      <I18nProvider initial="en">
        <Probe />
      </I18nProvider>,
    )

    expect(screen.getByText('Dashboard · 3 proofs')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
    expect((init.headers as Record<string, string>)['Accept-Language']).toBe('en')
  })

  it('reprend la langue mémorisée', () => {
    localStorage.setItem('devlink.lang', 'en')
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}'))),
    )

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )

    expect(screen.getByText(/^Dashboard/)).toBeInTheDocument()
    localStorage.removeItem('devlink.lang')
  })
})
