import { useEffect, useState } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark'
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : ''
    localStorage.setItem('theme', theme)
  }, [theme])

  return { theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }
}
