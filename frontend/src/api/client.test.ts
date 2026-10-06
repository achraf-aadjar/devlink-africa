import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request } from './client'

const store = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
})

afterEach(() => {
  store.clear()
  vi.restoreAllMocks()
})

describe('api client', () => {
  it('envoie le jeton et parse le JSON', async () => {
    store.set('devlink.access_token', 'abc')
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"status":"ok"}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const data = await request<{ status: string }>('/health/')
    expect(data.status).toBe('ok')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/health/')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer abc')
  })

  it('lève ApiError sur un statut en erreur', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"detail":"x"}', { status: 401 })),
    )
    await expect(request('/x/')).rejects.toBeInstanceOf(ApiError)
  })
})
