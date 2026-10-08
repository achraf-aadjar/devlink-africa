import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom n'implémente pas scrollIntoView (utilisé par Combobox pour garder
// l'option active visible pendant la navigation au clavier).
Element.prototype.scrollIntoView = vi.fn()

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
})
