import { Search, X } from 'lucide-react'

type Props = {
  value: string
  placeholder: string
  displayClearButton: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
}

export const SearchInput = ({ value, displayClearButton, placeholder, onClear, onChange }: Props) => {
  return (
    <div className="relative flex-1">
      <Search
        size={13}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md pl-7 pr-7 py-1.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors"
      />
      {displayClearButton && (
        <button
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
