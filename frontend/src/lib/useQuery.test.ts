import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useQuery } from './useQuery'

describe('useQuery', () => {
  it('commence en chargement puis expose la donnée', async () => {
    const { result } = renderHook(() => useQuery(() => Promise.resolve({ value: 1 }), ['a']))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual({ value: 1 })
    expect(result.current.error).toBeNull()
  })

  it('expose l erreur sans donnée', async () => {
    const { result } = renderHook(() => useQuery(() => Promise.reject(new Error('échec')), ['a']))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error?.message).toBe('échec')
    expect(result.current.data).toBeNull()
  })

  it('recharge quand la clé change', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok')
    const { result, rerender } = renderHook(({ id }) => useQuery(() => fetcher(id), [id]), {
      initialProps: { id: 1 },
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetcher).toHaveBeenCalledTimes(1)

    rerender({ id: 2 })

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
    expect(fetcher).toHaveBeenLastCalledWith(2)
  })

  it('ne recharge pas quand la clé est identique', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok')
    const { result, rerender } = renderHook(() => useQuery(() => fetcher(), ['stable']))

    await waitFor(() => expect(result.current.loading).toBe(false))
    rerender()
    rerender()

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('recharge à la demande', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok')
    const { result } = renderHook(() => useQuery(() => fetcher(), ['a']))
    await waitFor(() => expect(result.current.loading).toBe(false))

    result.current.reload()

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  })
})
