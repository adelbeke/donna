export const IS_NATIVE = !!window.electronAPI

export function ghIsInstalled(): Promise<boolean> {
  return window.electronAPI!.gh.isInstalled()
}

export function ghGraphql<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<{ data: T; errors?: { message: string }[] }> {
  return window.electronAPI!.gh.graphql(query, variables) as Promise<{
    data: T
    errors?: { message: string }[]
  }>
}

export function ghRest<T>(path: string): Promise<T> {
  return window.electronAPI!.gh.rest(path) as Promise<T>
}
