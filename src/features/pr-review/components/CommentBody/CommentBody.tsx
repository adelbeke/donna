import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import type { Components } from 'react-markdown'
import type { Schema } from 'hast-util-sanitize'

// GitHub-flavored bodies commonly wrap sections in raw <details>/<summary> — extend the
// default (safe) schema to keep allowing those on top of everything remark-gfm produces.
const sanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'details', 'summary'],
}

type Props = { body: string }

const components: Components = {
  a: ({ children, ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-accent)] hover:underline"
    >
      {children}
    </a>
  ),
  p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
  code: ({ children, className }) =>
    className ? (
      // fenced block — className carries the language as `language-xyz`, unused without highlighting
      <code className="block whitespace-pre overflow-x-auto">{children}</code>
    ) : (
      <code className="px-1 py-0.5 rounded bg-[var(--color-surface-overlay)] text-xs font-mono">
        {children}
      </code>
    ),
  pre: ({ children }) => (
    <pre className="rounded bg-[var(--color-surface-overlay)] p-2 my-2 text-xs font-mono overflow-x-auto">
      {children}
    </pre>
  ),
  ul: ({ children }) => <ul className="list-disc pl-5 text-sm">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 text-sm">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[var(--color-border)] pl-3 text-[var(--color-text-secondary)]">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-[var(--color-border)] px-2 py-1 text-left">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-[var(--color-border)] px-2 py-1">{children}</td>
  ),
}

export const CommentBody = ({ body }: Props) => (
  <div className="space-y-2 text-[var(--color-text-primary)]">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
      components={components}
    >
      {body}
    </ReactMarkdown>
  </div>
)
