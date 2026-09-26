import { useState } from 'react'

interface NumberFieldProps {
  id?: string
  value: number | null
  min?: number
  max?: number
  disabled?: boolean
  placeholder?: string
  /** Value committed when the field is left empty. Default: min ?? 0 */
  emptyValue?: number | null
  /** Called with a finite number, or null when empty and emptyValue is null. */
  onCommit: (next: number | null) => void
  'aria-label'?: string
  className?: string
}

/**
 * Text-mode numeric input that allows clearing mid-edit.
 * Commits on blur / Enter; selects contents on focus for easy replace.
 */
export default function NumberField({
  id,
  value,
  min,
  max,
  disabled,
  placeholder,
  emptyValue,
  onCommit,
  'aria-label': ariaLabel,
  className,
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const fallbackEmpty = emptyValue !== undefined ? emptyValue : (min ?? 0)
  const display =
    draft ?? (value == null || (value === 0 && placeholder) ? '' : String(value))

  function clamp(n: number): number {
    let next = n
    if (min != null) next = Math.max(min, next)
    if (max != null) next = Math.min(max, next)
    return next
  }

  function commit(raw: string) {
    const trimmed = raw.trim().replace(/,/g, '')
    if (trimmed === '' || trimmed === '-' || trimmed === '.') {
      onCommit(fallbackEmpty)
      setDraft(null)
      return
    }
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) {
      setDraft(null)
      return
    }
    onCommit(clamp(parsed))
    setDraft(null)
  }

  return (
    <input
      id={id}
      className={className}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={display}
      onFocus={(e) => {
        setDraft(value == null ? '' : String(value))
        e.currentTarget.select()
      }}
      onChange={(e) => {
        const next = e.target.value
        if (next === '' || /^-?\d*\.?\d*$/.test(next)) {
          setDraft(next)
        }
      }}
      onBlur={() => commit(draft ?? (value == null ? '' : String(value)))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
        if (e.key === 'Escape') {
          setDraft(null)
          e.currentTarget.blur()
        }
      }}
    />
  )
}
