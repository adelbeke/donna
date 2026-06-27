export const IS_NATIVE = !!window.electronAPI

export const ghIsInstalled = (): Promise<boolean> => window.electronAPI!.gh.isInstalled()

export const ghGraphql = <T>(
  query: string,
  variables: Record<string, unknown>
): Promise<{ data: T; errors?: { message: string }[] }> =>
  window.electronAPI!.gh.graphql(query, variables) as Promise<{
    data: T
    errors?: { message: string }[]
  }>

export const ghRest = <T>(path: string): Promise<T> =>
  window.electronAPI!.gh.rest(path) as Promise<T>
