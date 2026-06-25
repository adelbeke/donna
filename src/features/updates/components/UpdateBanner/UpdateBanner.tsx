import { useState, useEffect } from 'react'

export function UpdateBanner({ version }: { version: string }) {
  const [dismissed, setDismissed] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    // Check if update was already downloaded before this banner mounted (race condition)
    window.electronAPI?.updater?.isUpdateDownloaded().then(setDownloaded)
    window.electronAPI?.updater?.onUpdateDownloaded(() => setDownloaded(true))
  }, [])

  if (dismissed) return null
  return (
    <div className="flex items-center justify-between px-4 py-2 text-xs bg-[var(--color-accent)] text-white">
      <span>Version {version} is available.</span>
      <span className="flex items-center gap-3">
        {downloaded ? (
          <button
            className="underline cursor-pointer"
            onClick={() => window.electronAPI?.updater?.installUpdate()}
          >
            Restart to install
          </button>
        ) : (
          <a
            href="https://github.com/adelbeke/donna/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Download
          </a>
        )}
        <button onClick={() => setDismissed(true)}>✕</button>
      </span>
    </div>
  )
}
