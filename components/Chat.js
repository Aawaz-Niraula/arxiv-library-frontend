import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const MODES = ['answer', 'explain', 'compare', 'summarize']

export default function Chat({ selectedIds }) {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [mode,     setMode]     = useState('answer')
  const [loading,  setLoading]  = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleAsk() {
    const q = question.trim()
    if (!q || loading) return
    setMessages(prev => [...prev, { role: 'user', content: q, mode }])
    setQuestion('')
    setLoading(true)
    try {
      const res = await axios.post(`${API}/ask`, {
        question:  q,
        arxiv_ids: selectedIds.length > 0 ? selectedIds : null,
        mode,
      })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        citations: res.data.citations || [],
        chunks: res.data.chunks_used,
        mode,
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${e.response?.data?.detail || e.message}`,
        citations: [], isError: true,
      }])
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Mode bar */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        background: 'var(--void)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--faint)', marginRight: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          mode
        </span>
        {MODES.map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '5px 14px',
              border: `1px solid ${mode === m ? 'var(--border-glow)' : 'transparent'}`,
              borderRadius: '20px',
              background: mode === m ? 'var(--accent-dim)' : 'transparent',
              color: mode === m ? 'var(--accent)' : 'var(--muted)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em',
              transition: 'all 0.15s',
            }}
          >
            {m}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--faint)' }}>
          {selectedIds.length === 0 ? 'all papers' : `${selectedIds.length} paper${selectedIds.length > 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {messages.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.4 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 300, fontStyle: 'italic', color: 'var(--text)', marginBottom: '8px', letterSpacing: '0.02em' }}>
              Ask anything
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}>
              add papers · select a mode · ask
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>

            {/* Role label */}
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.12em',
              color: msg.role === 'user' ? 'var(--accent)' : 'var(--gold)',
              marginBottom: '6px',
              opacity: 0.7,
              textTransform: 'uppercase',
            }}>
              {msg.role === 'user' ? `you · ${msg.mode}` : 'arxiv library'}
            </span>

            {/* Bubble */}
            <div style={{
              maxWidth: '82%',
              padding: '14px 18px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user'
                ? 'var(--accent-dim)'
                : msg.isError ? 'rgba(248,113,113,0.08)' : 'var(--surface)',
              border: `1px solid ${msg.role === 'user' ? 'var(--border-glow)' : msg.isError ? 'rgba(248,113,113,0.2)' : 'var(--border)'}`,
              color: msg.isError ? 'var(--danger)' : 'var(--text)',
              fontSize: '13px',
              lineHeight: 1.75,
              whiteSpace: 'pre-wrap',
              fontWeight: 300,
            }}>
              {msg.content}
            </div>

            {/* Citations */}
            {msg.citations?.length > 0 && (
              <div style={{ maxWidth: '82%', marginTop: '10px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--faint)', marginBottom: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  sources · {msg.chunks} chunks
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {msg.citations.map((c, j) => (
                    <a
                      key={j}
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        padding: '4px 10px',
                        background: 'var(--gold-dim)',
                        border: '1px solid rgba(201,169,110,0.2)',
                        borderRadius: '4px',
                        color: 'var(--gold)',
                        transition: 'all 0.15s',
                      }}
                    >
                      [{j+1}] {c.title?.slice(0, 30)}… · {c.section?.slice(0, 20)}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: 'var(--accent)',
              animation: 'pulse 1.2s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.08em' }}>
              searching library...
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border)',
        background: 'var(--void)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
      }}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAsk()}
          placeholder="What would you like to know about these papers?"
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'var(--deep)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text)',
            fontSize: '13px',
            outline: 'none',
            transition: 'border-color 0.2s',
            fontStyle: question ? 'normal' : 'italic',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--border-glow)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          style={{
            padding: '12px 22px',
            background: loading || !question.trim() ? 'var(--deep)' : 'var(--accent-dim)',
            border: `1px solid ${loading || !question.trim() ? 'var(--border)' : 'var(--border-glow)'}`,
            borderRadius: '8px',
            color: loading || !question.trim() ? 'var(--faint)' : 'var(--accent)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          ask →
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
