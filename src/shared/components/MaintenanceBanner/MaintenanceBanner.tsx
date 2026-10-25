const DISCUSSION_URL = 'https://github.com/adelbeke/donna/discussions/264'

// ponytail: deliberately not dismissible, every user must see the survey until the project's fate is decided
export const MaintenanceBanner = () => (
  <div className="px-4 py-2 text-xs text-center bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border-b border-[var(--color-border)]">
    With the rise of new tools and the latest GitHub updates, I wonder if Donna is still useful. If
    you still use it,{' '}
    <a
      href={DISCUSSION_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="underline font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
    >
      let me know
    </a>
    : Donna will keep minimal maintenance. Otherwise, the project will be archived.
  </div>
)
