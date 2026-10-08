import type { SelectHTMLAttributes } from 'react'
import { useId } from 'react'
import { cn } from '../../lib/cn'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  error?: string
  options: Array<{ value: string; label: string }>
  /** Première option neutre, par exemple « Tous les pays ». */
  placeholder?: string
}

/** Liste déroulante accessible : label lié, erreur annoncée. */
export default function Select({
  label,
  error,
  options,
  placeholder,
  className,
  ...rest
}: SelectProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-800">
        {label}
      </label>
      <select
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'field text-ink-900',
          error ? 'border-red-500/70' : 'border-white/10',
          className,
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
