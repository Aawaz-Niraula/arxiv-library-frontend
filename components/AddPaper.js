import { useState } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AddPaper({ onPaperAdded }) {
  const [url,     setUrl]     = useState('')
  const [status,  setStatus]  = useState(null)
  const [message, setMessage] = useState('')

  async function handleAdd() {
    if (!url.trim()) return
    setStatus('loading')
    setMessage('')
    try {
      const res = await axios.post(`${API}/papers/add`, { url: url.trim() })
      if (res.data.status === 'already_exists') {
        setStatus('error')
        setMessage('Already in library')
      } else {
        setStatus('success')
        setMessage(`Indexed — ${res.data.chunks_created} sections`)
        setUrl('')
        onPaperAdded()
      }
    } catch (e) {
      setStatus('error')
      setMessage(e.response?.data?.detail || 'Could not reach server')
    }
    setTimeout(() => { setStatus(null); setMessage('') }, 4000)
  }

  return (
    <div style={{ marginBottom: '28px' }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        marginBottom: '10px',
      }}>
        Add Paper
      </p>

      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        placeholder="arxiv.org/abs/..."
        disabled={status === 'loading'}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'var(--deep)',
          border: `1px solid ${status === 'loading' ? 'var(--border-glow)' : 'var(--border)'}`,
          borderRadius: '6px',
          color: 'var(--text)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          outline: 'none',
          transition: 'border-color 0.2s',
          marginBottom: '8px',
          display: 'block',
        }}
      />

      <button
        onClick={handleAdd}
        disabled={status === 'loading' || !url.trim()}
        style={{
          width: '100%',
          padding: '9px',
          background: status === 'loading' ? 'var(--elevated)' : 'var(--accent-dim)',
          border: `1px solid ${status === 'loading' ? 'var(--border)' : 'var(--border-glow)'}`,
          borderRadius: '6px',
          color: status === 'loading' ? 'var(--muted)' : 'var(--accent)',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.1em',
          transition: 'all 0.2s',
        }}
      >
        {status === 'loading' ? 'indexing...' : 'index paper'}
      </button>

      {message && (
        <p style={{
          marginTop: '8px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: status === 'success' ? 'var(--success)' : 'var(--danger)',
        }}>
          {status === 'success' ? '✓ ' : '✗ '}{message}
        </p>
      )}

      {status === 'loading' && (
        <p style={{ marginTop: '6px', fontSize: '10px', color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}>
          first request ~30s on free tier
        </p>
      )}
    </div>
  )
}
