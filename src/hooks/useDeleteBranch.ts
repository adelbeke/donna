import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'

export function useDeleteBranch() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ repo, name }: { repo: string; name: string }) => {
      const [owner, repoName] = repo.split('/')
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${name}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      )
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
    },
    onMutate: async ({ repo, name }) => {
      await queryClient.cancelQueries({ queryKey: ['branches'] })
      queryClient.setQueriesData<{ name: string; repo: string }[]>(
        { queryKey: ['branches'] },
        (old) => old?.filter((b) => !(b.name === name && b.repo === repo)) ?? []
      )
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
  })
}
