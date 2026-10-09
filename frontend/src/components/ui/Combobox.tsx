import { useEffect, useId, useRef, useState } from 'react'
import Icon from '../icons/Icon'
import { cn } from '../../lib/cn'
import { useI18n } from '../../i18n/useI18n'

export interface ComboboxOption {
  value: string
  label: string
}

/** Compare sans tenir compte des accents : « se » doit trouver « Sénégal ». */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

interface ComboboxProps {
  label: string
  value: string
  options: ComboboxOption[]
  onChange: (value: string) => void
  placeholder?: string
  error?: string
}

/**
 * Liste déroulante avec recherche, pour les listes longues (la liste de pays,
 * en particulier).
 *
 * Pourquoi pas un `<select>` natif ici : sur une longue liste, le survol de la
 * molette au-dessus d'un `<select>` focus change sa valeur au lieu de faire
 * défiler la page — un comportement du navigateur, pas de notre code, mais qui
 * se lit comme un bug pour qui remplit le formulaire en faisant défiler la
 * page. En dessinant notre propre liste déroulante, le défilement de la souris
 * ne fait jamais autre chose que ce sur quoi elle se trouve : la page si le
 * curseur est sur la page, la liste si elle est ouverte et que le curseur est
 * dessus.
 */
export default function Combobox({
  label,
  value,
  options,
  onChange,
  placeholder,
  error,
}: ComboboxProps) {
  const { t } = useI18n()
  const id = useId()
  const listId = `${id}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const selected = options.find((option) => option.value === value)
  const normalizedQuery = normalize(query.trim())
  const filtered = normalizedQuery
    ? options.filter((option) => normalize(option.label).includes(normalizedQuery))
    : options

  // Ferme au clic en dehors.
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Garde l'option active visible pendant la navigation au clavier.
  useEffect(() => {
    if (!open) return
    const activeEl = listRef.current?.children[activeIndex] as HTMLElement | undefined
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  function openList() {
    if (!open) {
      setOpen(true)
      setQuery('')
      setActiveIndex(0)
    }
  }

  function choose(option: ComboboxOption) {
    onChange(option.value)
    setOpen(false)
    setQuery('')
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault()
        openList()
      }
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (filtered[activeIndex]) choose(filtered[activeIndex])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-800">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && filtered[activeIndex] ? `${id}-option-${activeIndex}` : undefined
          }
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          value={open ? query : (selected?.label ?? '')}
          placeholder={placeholder ?? t('Choisir…')}
          onFocus={openList}
          onClick={openList}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            setActiveIndex(0)
          }}
          onKeyDown={onKeyDown}
          className={cn(
            'w-full rounded-lg border bg-ink-100 px-3 py-2 pr-9 text-ink-900 placeholder:text-ink-400',
            error ? 'border-red-500' : 'border-ink-300',
          )}
        />
        <Icon
          name="chevronDown"
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-500"
        />
        {open && (
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            aria-label={label}
            className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-ink-300 bg-ink-100 py-1 shadow-card"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-ink-500">{t('Aucun résultat.')}</li>
            )}
            {filtered.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={option.value === value}
                onMouseDown={(event) => {
                  // Empêche le `blur` de l'input de fermer la liste avant le clic.
                  event.preventDefault()
                  choose(option)
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm',
                  index === activeIndex ? 'bg-accent-50 text-accent-800' : 'text-ink-800',
                )}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
