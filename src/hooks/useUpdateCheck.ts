import { useQuery } from '@tanstack/react-query'

export function isNewer(latest: string, current: string) {
  const a = latest.replace(/^v/, '').split('.').map(Number)
  const b = current.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (a[i] > b[i]) return true
    if (a[i] < b[i]) return false
  }
  return false
}

export function useUpdateCheck() {
  return useQuery({
    queryKey: ['update-check'],
    queryFn: async () => {
      try {
        const data = await window.electronAPI!.gh.rest('repos/adelbeke/donna/releases/latest')
        return (data as { tag_name: string }).tag_name
      } catch {
        return null
      }
    },
    staleTime: 60 * 60 * 1000,
    enabled: !!window.electronAPI,
  })
}
