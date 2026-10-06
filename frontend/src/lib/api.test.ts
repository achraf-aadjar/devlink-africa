import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, request } from './api'
import { setTokens } from './token'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('client dAPI', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('préfixe le chemin par la base et analyse le JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: 'ok', version: '0.1.0' }))
    vi.stubGlobal('fetch', fetchMock)

    const health = await api.get<{ status: string }>('/health/')

    expect(health.status).toBe('ok')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/health/')
  })

  it('ajoute le jeton dAccès quand il existe', async () => {
    setTokens({ access: 'jeton-acces', refresh: 'jeton-refresh' })
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}))
    vi.stubGlobal('fetch', fetchMock)

    await api.get('/me/')

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer jeton-acces')
  })

  it("n'envoie aucun jeton quand auth vaut false", async () => {
    setTokens({ access: 'jeton-acces', refresh: 'jeton-refresh' })
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}))
    vi.stubGlobal('fetch', fetchMock)

    await api.post('/auth/login/', { email: 'a@b.org' }, { auth: false })

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })

  it('lève une ApiError qui porte le code et les erreurs de champ', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(
            { detail: 'Invalide.', code: 'invalid', errors: { password: ['Trop court.'] } },
            400,
          ),
        ),
    )

    const thrown: unknown = await request('/auth/register/', { method: 'POST' }).catch((e) => e)

    expect(thrown).toBeInstanceOf(ApiError)
    const error = thrown as ApiError
    expect(error.status).toBe(400)
    expect(error.code).toBe('invalid')
    expect(error.fieldError('password')).toBe('Trop court.')
  })

  it('renvoie undefined sur un 204 sans corps', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    await expect(api.post('/auth/logout/', { refresh: 'x' })).resolves.toBeUndefined()
  })

  it('renouvelle le jeton après un 401 puis rejoue la requête', async () => {
    setTokens({ access: 'jeton-expire', refresh: 'jeton-refresh' })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ detail: 'Expiré.', code: 'token_not_valid' }, 401))
      .mockResolvedValueOnce(jsonResponse({ access: 'nouvel-acces', refresh: 'nouveau-refresh' }))
      .mockResolvedValueOnce(jsonResponse({ id: 1, email: 'a@b.org' }))
    vi.stubGlobal('fetch', fetchMock)

    const me = await api.get<{ id: number }>('/me/')

    expect(me.id).toBe(1)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/refresh/')
    const replayHeaders = fetchMock.mock.calls[2][1].headers as Record<string, string>
    expect(replayHeaders.Authorization).toBe('Bearer nouvel-acces')
  })

  it('efface la session si le renouvellement échoue', async () => {
    setTokens({ access: 'jeton-expire', refresh: 'jeton-revoque' })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ code: 'token_not_valid' }, 401))
        .mockResolvedValueOnce(jsonResponse({ code: 'token_not_valid' }, 401)),
    )

    await expect(api.get('/me/')).rejects.toBeInstanceOf(ApiError)
    expect(localStorage.getItem('devlink.access_token')).toBeNull()
  })

  it('ne tente aucun renouvellement sans jeton de rafraîchissement', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ code: 'not_authenticated' }, 401))
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.get('/me/')).rejects.toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
