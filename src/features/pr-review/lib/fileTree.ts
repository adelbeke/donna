import type { PRFile } from '../types'

export type TreeNode =
  | { kind: 'dir'; name: string; path: string; children: TreeNode[] }
  | { kind: 'file'; name: string; file: PRFile }

type DirBuilder = {
  name: string
  path: string
  dirs: Map<string, DirBuilder>
  files: PRFile[]
}

const makeDir = (name: string, path: string): DirBuilder => ({
  name,
  path,
  dirs: new Map(),
  files: [],
})

// Merge a chain of directories that each hold nothing but a single subdirectory into one row,
// matching GitHub's tree view (e.g. `src/features/pr-review` instead of three nested rows).
const collapse = (dir: DirBuilder): DirBuilder => {
  let node = dir
  while (node.files.length === 0 && node.dirs.size === 1) {
    const onlyChild = [...node.dirs.values()][0]
    node = {
      name: `${node.name}/${onlyChild.name}`,
      path: onlyChild.path,
      dirs: onlyChild.dirs,
      files: onlyChild.files,
    }
  }
  return node
}

const childrenOf = (dir: DirBuilder): TreeNode[] => {
  const dirNodes: TreeNode[] = [...dir.dirs.values()]
    .map(collapse)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => ({ kind: 'dir' as const, name: d.name, path: d.path, children: childrenOf(d) }))

  const fileNodes: TreeNode[] = [...dir.files]
    .sort((a, b) => a.filename.localeCompare(b.filename))
    .map((f) => ({
      kind: 'file' as const,
      name: f.filename.split('/').at(-1) ?? f.filename,
      file: f,
    }))

  return [...dirNodes, ...fileNodes]
}

export const buildFileTree = (files: PRFile[]): TreeNode[] => {
  const root = makeDir('', '')

  for (const file of files) {
    const parts = file.filename.split('/')
    const dirParts = parts.slice(0, -1)
    let cur = root
    let path = ''
    for (const part of dirParts) {
      path = path ? `${path}/${part}` : part
      if (!cur.dirs.has(part)) cur.dirs.set(part, makeDir(part, path))
      cur = cur.dirs.get(part) as DirBuilder
    }
    cur.files.push(file)
  }

  return childrenOf(root)
}
