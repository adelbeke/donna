import { useQuery } from '@tanstack/react-query'
import type { GithubRelease } from '@/features/updates/types.ts'

const MAX_RELEASES = 10

export const useChangelog = (enabled: boolean) =>
  useQuery({
    queryKey: ['changelog'],
    queryFn: async () => {
      const data = await window.electronAPI!.gh.rest('repos/adelbeke/donna/releases')
      return (data as GithubRelease[]).slice(0, MAX_RELEASES)
    },
    staleTime: 60 * 60 * 1000,
    enabled: enabled && !!window.electronAPI,
  })
