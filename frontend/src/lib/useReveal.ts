import { useEffect, useRef, useState } from 'react'

/**
 * Indique si un élément est entré dans l'écran, une seule fois.
 *
 * Sert aux apparitions au défilement de la page d'accueil. Sans
 * IntersectionObserver (vieux navigateur, jsdom en test), l'élément est
 * considéré visible d'emblée : le contenu n'est jamais caché faute d'API.
 */
export function useReveal<T extends Element>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [visible])

  return { ref, visible }
}
