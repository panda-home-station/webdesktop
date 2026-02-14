import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownContentProps {
  content: string
  color?: string
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, color }) => {
  return (
    <div className="markdown-body" style={{ color: color || 'inherit' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          p: ({ children }) => <p style={{ margin: '4px 0', lineHeight: 1.6 }}>{children}</p>,
          ul: ({ children }) => <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,
          h1: ({ children }) => <h1 style={{ fontSize: '1.5em', margin: '12px 0 8px' }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: '1.3em', margin: '10px 0 6px' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: '1.1em', margin: '8px 0 4px' }}>{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote style={{ 
              borderLeft: '4px solid #ddd', 
              margin: '8px 0', 
              paddingLeft: '12px', 
              color: '#666',
              fontStyle: 'italic'
            }}>
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '12px 0' }}>
              <table style={{ 
                borderCollapse: 'collapse', 
                width: '100%',
                fontSize: '13px',
                border: '1px solid #eee'
              }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{ 
              border: '1px solid #eee', 
              padding: '6px 10px', 
              backgroundColor: '#f5f5f5',
              fontWeight: 600
            }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{ 
              border: '1px solid #eee', 
              padding: '6px 10px'
            }}>
              {children}
            </td>
          )
        }}
      >
        {content}
      </ReactMarkdown>
      <style>{`
        .markdown-body code {
          background-color: rgba(0,0,0,0.05);
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
        }
        .markdown-body pre {
          margin: 12px 0;
          border-radius: 8px;
          overflow: hidden;
        }
        .markdown-body p:first-child { margin-top: 0; }
        .markdown-body p:last-child { margin-bottom: 0; }
      `}</style>
    </div>
  )
}
