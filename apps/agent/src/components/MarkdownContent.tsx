import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react'

interface MarkdownContentProps {
  content: string
  color?: string
}

const CodeBlock = ({ language, value }: { language: string, value: string }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value)
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea")
        textArea.value = value
        textArea.style.position = "fixed"
        textArea.style.left = "-9999px"
        textArea.style.top = "0"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
        } catch (err) {
          console.error('Fallback copy failed', err)
        }
        document.body.removeChild(textArea)
      }
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div style={{ 
      margin: '8px 0', 
      borderRadius: '8px', 
      border: '1px solid #d1d5db', 
      overflow: 'hidden', 
      backgroundColor: '#e5e7eb', // 统一背景色为标题栏颜色，防止圆角露底
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '8px 12px', 
          backgroundColor: '#e5e7eb', // 灰色标题栏
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background-color 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: 20, 
            height: 20, 
            borderRadius: '4px', 
            backgroundColor: '#f3f4f6', 
            border: '1px solid #d1d5db' 
          }}>
            {isExpanded ? <ChevronDown size={13} color="#4b5563" /> : <ChevronRight size={13} color="#4b5563" />}
          </div>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 600, 
            color: '#374151', 
            letterSpacing: '0.025em', 
            fontFamily: 'monospace' 
          }}>
            {language}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            onClick={handleCopy}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#4b5563',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#d1d5db'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {isCopied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{ 
          width: '100%', 
          overflow: 'auto',
          backgroundColor: '#282c34', // 确保展开区域背景为深色
          borderTop: '1px solid #d1d5db' // 在展开时显示分割线
        }}>
          <SyntaxHighlighter
            style={{
              ...oneDark,
              'pre[class*="language-"]': {
                ...oneDark['pre[class*="language-"]'],
                margin: 0,
                padding: '12px 16px',
                backgroundColor: '#282c34', // 显式设置背景 
                fontSize: '13px',
                lineHeight: '1.6',
                border: 'none'
              },
              'code[class*="language-"]': {
                ...oneDark['code[class*="language-"]'],
                textShadow: 'none',
                background: '#282c34' // 显式设置背景
              }
            }}
            language={language}
            PreTag="div"
          >
            {value}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  )
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, color }) => {
  return (
    <div className="markdown-body" style={{ color: color || 'inherit', fontSize: '15px', lineHeight: '1.5', width: '100%' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            const value = String(children).replace(/\n$/, '')
            
            return !inline && match ? (
              <CodeBlock language={match[1]} value={value} />
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          p: ({ children }) => <div style={{ margin: '4px 0', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{children}</div>,
          h1: ({ children }) => <h1 style={{ margin: '8px 0 4px 0', fontSize: '1.25em', fontWeight: 700 }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ margin: '8px 0 4px 0', fontSize: '1.15em', fontWeight: 600 }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ margin: '6px 0 3px 0', fontSize: '1.05em', fontWeight: 600 }}>{children}</h3>,
          ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '20px', lineHeight: '1.5' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: '20px', lineHeight: '1.5' }}>{children}</ol>,
          li: ({ children }) => (
            <li style={{ 
              margin: '0.2em 0', 
              whiteSpace: 'pre-wrap', 
              lineHeight: '1.5'
            }}>
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{ 
              borderLeft: '4px solid #ddd', 
              margin: '8px 0', 
              paddingLeft: '12px', 
              color: '#666',
              fontStyle: 'italic',
              lineHeight: 'inherit'
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
              padding: '6px 10px',
              whiteSpace: 'pre-wrap',
              lineHeight: 'inherit'
            }}>
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#0066cc', textDecoration: 'underline' }}
            >
              {children}
            </a>
          ),
          hr: () => <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '16px 0' }} />,
          img: ({ src, alt }) => (
            <img 
              src={src} 
              alt={alt} 
              style={{ maxWidth: '100%', borderRadius: '4px', margin: '8px 0' }} 
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      <style>{`
        .markdown-body {
          line-height: 1.5 !important;
        }
        .markdown-body * {
          line-height: 1.5 !important;
        }
        .markdown-body p, .markdown-body div, .markdown-body li, .markdown-body span {
          line-height: 1.5 !important;
        }
        .markdown-body code {
          background-color: rgba(0,0,0,0.03);
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
        }
        .markdown-body pre {
          margin: 4px 0;
          border-radius: 8px;
          overflow: hidden;
        }
        .markdown-body p:first-child { margin-top: 0; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body p:empty {
          display: none;
        }
        .markdown-body li p {
          display: inline !important;
          margin: 0 !important;
          line-height: inherit !important;
        }
      `}</style>
    </div>
  )
}
