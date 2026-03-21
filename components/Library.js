import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Library({ papers, selectedIds, onToggle, onRefresh }) {

  async function handleDelete(e, arxiv_id) {
    e.stopPropagation()
    if (!confirm('Remove this paper?')) return
    try {
      await axios.delete(`${API}/papers/${arxiv_id}`)
      onRefresh()
    } catch { alert('Failed to remove paper.') }
  }

  if (papers.length === 0) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--faint)', fontSize: '12px', fontStyle: 'italic', fontFamily: 'var(--font-display)', fontSize: '15px' }}>
          No papers yet
        </p>
        <p style={{ color: 'var(--faint)', fontSize: '10px', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
          add one above
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}>
          Library — {papers.length} paper{papers.length !== 1 ? 's' : ''}
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--faint)' }}>
          {selectedIds.length === 0 ? 'all' : `${selectedIds.length} selected`}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {papers.map(paper => {
          const selected = selectedIds.includes(paper.arxiv_id)
          return (
            <div
              key={paper.arxiv_id}
              onClick={() => onToggle(paper.arxiv_id)}
              style={{
                padding: '12px 14px',
                background: selected ? 'var(--elevated)' : 'var(--deep)',
                border: `1px solid ${selected ? 'var(--border-glow)' : 'var(--border)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s',
                boxShadow: selected ? '0 0 12px rgba(139,120,255,0.08)' : 'none',
              }}
            >
              {/* Selected indicator */}
              {selected && (
                <div style={{
                  position: 'absolute',
                  left: 0, top: '50%',
                  transform: 'translateY(-50%)',
                  width: '2px', height: '60%',
                  background: 'var(--accent)',
                  borderRadius: '0 2px 2px 0',
                }} />
              )}

              <p style={{
                fontSize: '12px',
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                lineHeight: 1.4,
                color: selected ? 'var(--text)' : 'rgba(232,230,240,0.8)',
                paddingRight: '20px',
                marginBottom: '6px',
              }}>
                {paper.title?.length > 65 ? paper.title.slice(0, 65) + '…' : paper.title}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)' }}>
                  {paper.arxiv_id} · {paper.chunk_count} sections
                </span>
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--accent)', opacity: 0.7 }}
                >
                  arxiv ↗
                </a>
              </div>

              {/* Delete button */}
              <button
                onClick={e => handleDelete(e, paper.arxiv_id)}
                style={{
                  position: 'absolute', top: '8px', right: '8px',
                  background: 'none', border: 'none',
                  color: 'var(--faint)', fontSize: '12px',
                  lineHeight: 1, padding: '2px 4px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.target.style.color = 'var(--danger)'}
                onMouseLeave={e => e.target.style.color = 'var(--faint)'}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
