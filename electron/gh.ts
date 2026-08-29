import { spawn } from 'node:child_process'

// ponytail: augment PATH so macOS .app bundles find gh via Homebrew/nix paths
export const GH_PATH = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', process.env.PATH]
  .filter(Boolean)
  .join(':')

export const runGh = (args: string[], stdinData?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const proc = spawn('gh', args, { env: { ...process.env, PATH: GH_PATH } })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d: Buffer) => (stdout += d.toString()))
    proc.stderr.on('data', (d: Buffer) => (stderr += d.toString()))
    proc.on('close', (code: number | null) => {
      if (code === 0) resolve(stdout)
      else reject(new Error(stderr || `gh exited with code ${code}`))
    })
    proc.on('error', reject)
    if (stdinData) proc.stdin.write(stdinData)
    proc.stdin.end()
  })
}
