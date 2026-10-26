type Props = {
  title: string
  url: string
}

export const MergedPRRow = ({ title, url }: Props) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="block cursor-pointer truncate rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] shadow-[var(--shadow-card)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
  >
    {title}
  </a>
)
