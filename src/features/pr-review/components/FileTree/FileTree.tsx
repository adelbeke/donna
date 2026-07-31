import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText } from 'lucide-react'
import type { TreeNode } from '../../lib/fileTree'

type Props = {
  nodes: TreeNode[]
  onSelectFile: (filename: string) => void
}

export const FileTree = ({ nodes, onSelectFile }: Props) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggleDir = (path: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })

  const renderNodes = (nodes: TreeNode[]) =>
    nodes.map((node) => {
      if (node.kind === 'dir') {
        const isCollapsed = collapsed.has(node.path)
        return (
          <div key={node.path}>
            <button
              onClick={() => toggleDir(node.path)}
              className="flex items-center gap-1 w-full text-left text-xs px-2 py-1 rounded cursor-pointer text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
            >
              {isCollapsed ? (
                <ChevronRight size={12} className="shrink-0" />
              ) : (
                <ChevronDown size={12} className="shrink-0" />
              )}
              <span className="truncate" title={node.path}>
                {node.name}
              </span>
            </button>
            {!isCollapsed && (
              <div className="ml-2 pl-2 border-l border-[var(--color-border-subtle)]">
                {renderNodes(node.children)}
              </div>
            )}
          </div>
        )
      }

      return (
        <button
          key={node.file.filename}
          onClick={() => onSelectFile(node.file.filename)}
          className="flex items-center gap-1 w-full text-left text-xs px-2 py-1 rounded cursor-pointer text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
        >
          <FileText size={12} className="shrink-0 text-[var(--color-text-muted)]" />
          <span className="truncate flex-1" title={node.file.filename}>
            {node.name}
          </span>
          <span className="shrink-0 font-mono">
            <span className="text-[var(--color-success)]">+{node.file.additions}</span>{' '}
            <span className="text-[var(--color-danger)]">-{node.file.deletions}</span>
          </span>
        </button>
      )
    })

  return <div className="space-y-0.5">{renderNodes(nodes)}</div>
}
