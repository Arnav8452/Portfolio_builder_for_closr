"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type RetroMarkdownProps = {
  content: string;
  title?: string;
  number?: string;
};

export function RetroMarkdown({ content, title = "README", number = "04" }: RetroMarkdownProps) {
  if (!content) return null;

  return (
    <div style={{ padding: "48px 24px", backgroundColor: "var(--arcade-cream)" }}>
      <h2 
        style={{ 
          fontFamily: "'Press Start 2P', monospace", 
          fontSize: "12px", 
          color: "var(--arcade-red)",
          textTransform: "uppercase",
          marginBottom: "32px",
          display: "flex",
          gap: "16px"
        }}
      >
        <span>{number}</span>
        <span>.</span>
        <span>{title}</span>
      </h2>

      <div 
        className="pixel-border" 
        style={{ 
          backgroundColor: "var(--arcade-cream-soft)",
          padding: "32px",
          color: "var(--arcade-ink)",
          fontFamily: "'Inter', sans-serif"
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto", overflow: "hidden" }}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({node, ...props}) => (
                <img {...props} style={{ maxWidth: '100%', border: '2px solid var(--arcade-ink)', marginTop: '16px', marginBottom: '16px' }} />
              ),
              a: ({node, ...props}) => (
                <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--arcade-blue)', textDecoration: 'underline', textDecorationStyle: 'dashed' }} />
              ),
              h1: ({node, ...props}) => (
                <h1 {...props} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '18px', marginTop: '32px', marginBottom: '16px', textTransform: 'uppercase' }} />
              ),
              h2: ({node, ...props}) => (
                <h2 {...props} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '14px', marginTop: '24px', marginBottom: '16px', textTransform: 'uppercase', borderBottom: '2px solid var(--arcade-ink)', paddingBottom: '8px' }} />
              ),
              h3: ({node, ...props}) => (
                <h3 {...props} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '12px', marginTop: '24px', marginBottom: '12px', textTransform: 'uppercase' }} />
              ),
              p: ({node, ...props}) => (
                <p {...props} style={{ lineHeight: '1.8', marginBottom: '16px', fontSize: '15px' }} />
              ),
              ul: ({node, ...props}) => (
                <ul {...props} style={{ paddingLeft: '24px', marginBottom: '16px', listStyleType: 'square', lineHeight: '1.8', fontSize: '15px' }} />
              ),
              ol: ({node, ...props}) => (
                <ol {...props} style={{ paddingLeft: '24px', marginBottom: '16px', lineHeight: '1.8', fontSize: '15px' }} />
              ),
              li: ({node, ...props}) => (
                <li {...props} style={{ marginBottom: '8px' }} />
              ),
              code: ({node, inline, className, children, ...props}: any) => {
                const match = /language-(\w+)/.exec(className || '')
                return inline ? (
                  <code {...props} style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '2px 4px', fontFamily: "'Press Start 2P', monospace", fontSize: '10px' }}>
                    {children}
                  </code>
                ) : (
                  <div className="pixel-border" style={{ backgroundColor: 'var(--arcade-ink)', color: 'var(--arcade-green)', padding: '16px', overflowX: 'auto', marginBottom: '16px', fontFamily: "'Press Start 2P', monospace", fontSize: '10px', lineHeight: '1.6' }}>
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </div>
                )
              },
              blockquote: ({node, ...props}) => (
                <blockquote {...props} style={{ borderLeft: '4px solid var(--arcade-purple)', paddingLeft: '16px', fontStyle: 'italic', color: 'var(--muted-2)', marginBottom: '16px', backgroundColor: 'rgba(0,0,0,0.02)', padding: '16px' }} />
              ),
              table: ({node, ...props}) => (
                <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                  <table {...props} style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--arcade-ink)' }} />
                </div>
              ),
              th: ({node, ...props}) => (
                <th {...props} style={{ border: '2px solid var(--arcade-ink)', padding: '8px', backgroundColor: 'var(--arcade-cream)', fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }} />
              ),
              td: ({node, ...props}) => (
                <td {...props} style={{ border: '2px solid var(--arcade-ink)', padding: '8px', fontSize: '14px' }} />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
