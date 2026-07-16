export type Shortcut = { id: string; name: string; body: string }

export type ShortcutRunResult = {
  stdout: string
  stderr: string
  exitCode: number | null
  timedOut: boolean
}
