export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">
      <a
        href="https://arthurdelbeke.com"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-[var(--color-accent)] transition-colors"
      >
        Made by Arthur
      </a>
      <span className="mx-2">—</span>
      <a
        href="https://buymeacoffee.com/adelbeke"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-[var(--color-accent)] transition-colors"
      >
        Buy me a coffee
      </a>
    </footer>
  )
}
