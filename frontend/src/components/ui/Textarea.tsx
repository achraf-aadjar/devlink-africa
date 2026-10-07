import type { TextareaHTMLAttributes } from 'react'
import { useId } from 'react'
import { cn } from '../../lib/cn'

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  error?: string
  hint?: string
}

export default function Textarea({
  label,
  error,
  hint,
  className,
  required,
  ...rest
}: TextareaProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-800">
        {label}
        {required && (
          <span className="ml-1 text-accent-700" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <textarea
        {...rest}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          'min-h-24 rounded-lg border bg-white px-3 py-2 text-ink-900 placeholder:text-ink-400',
          error ? 'border-red-700' : 'border-ink-300',
          className,
        )}
      />
      {hint && (
        <p id={hintId} className="text-xs text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
