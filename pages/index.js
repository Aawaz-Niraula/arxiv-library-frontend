import { useState, useEffect } from 'react'
import axios from 'axios'
import Head from 'next/head'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const MODES = ['answer', 'explain', 'compare', 'summarize']

export default function Home() {
  const [papers,      setPapers]      = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [url,         setUrl]         = useState('')
  const [addStatus,   setAddStatus]   = useState(null)
  const [addMsg,      setAddMsg]      = useState('')
  const [messages,    setMessages]    = useState([])
  const [question,    setQuestion]    = useState('')
  const [mode,        setMode]        = useState('answer')
  const [asking,      setAsking]      = useState(false)
  const [mounted,     setMounted]     = useState(false)

  useEffect(() => { setMounted(true); fetchLibrary() }, [])

  async function fetchLibrary() {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/papers`)
      const nextPapers = res.data.papers || []
      setPapers(nextPapers)
      setSelectedIds(prev =>
        prev.filter(id => nextPapers.some(paper => paper.arxiv_id === id))
      )
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  async function handleAdd() {
    if (!url.trim()) return
    setAddStatus('loading'); setAddMsg('')
    try {
      const res = await axios.post(`${API}/papers/add`, { url: url.trim() })
      if (res.data.status === 'already_exists') {
        setAddStatus('error'); setAddMsg('Already in library')
      } else {
        setAddStatus('success')
        setAddMsg(`✓  ${res.data.chunks_created} sections indexed`)
        setUrl(''); fetchLibrary()
      }
    } catch(e) {
      setAddStatus('error')
      setAddMsg(e.response?.data?.detail || 'Could not reach server')
    }
    setTimeout(() => { setAddStatus(null); setAddMsg('') }, 4000)
  }

  async function handleAsk() {
    const q = question.trim()
    if (!q || asking) return
    setMessages(prev => [...prev, { role: 'user', content: q, mode }])
    setQuestion(''); setAsking(true)
    try {
      const res = await axios.post(`${API}/ask`, {
        question: q,
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
    } catch(e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${e.response?.data?.detail || e.message}`,
        citations: [], isError: true,
      }])
    }
    setAsking(false)
  }

  function togglePaper(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function deletePaper(e, id) {
    e.stopPropagation()
    if (!confirm('Remove this paper?')) return
    try {
      await axios.delete(`${API}/papers/${id}`)
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
      fetchLibrary()
    }
    catch { alert('Failed to remove.') }
  }

  return (
    <>
      <Head>
        <title>ArXiv Library — by Aawaz</title>
      </Head>

      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--black)', opacity: mounted ? 1 : 0, transition: 'opacity 0.4s' }}>

        {/* ══ SIDEBAR ══ */}
        <div style={{
          width:'320px', minWidth:'320px',
          borderRight:'1px solid var(--border)',
          display:'flex', flexDirection:'column',
          background:'var(--void)',
          overflow:'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding:'32px 24px 24px',
            borderBottom:'1px solid var(--border)',
            position:'relative',
            overflow:'hidden',
          }}>
            {/* Glow orb behind header */}
            <div style={{
              position:'absolute', top:'-40px', left:'-40px',
              width:'200px', height:'200px',
              background:'radial-gradient(circle, rgba(139,120,255,0.12) 0%, transparent 70%)',
              pointerEvents:'none',
            }}/>

            <div style={{ position:'relative' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 12px var(--accent), 0 0 24px rgba(139,120,255,0.4)' }}/>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--accent)', letterSpacing:'0.2em', textTransform:'uppercase' }}>
                  Research Intelligence
                </span>
              </div>

              <h1 style={{
                fontFamily:'var(--font-display)',
                fontSize:'36px',
                fontWeight:300,
                fontStyle:'italic',
                color:'var(--text)',
                lineHeight:1.1,
                marginBottom:'6px',
                letterSpacing:'-0.01em',
              }}>
                ArXiv<br/>Library
              </h1>

              <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--muted)', letterSpacing:'0.12em' }}>
                semantic · cited · persistent
              </p>
            </div>
          </div>

          {/* Add paper */}
          <div style={{ padding:'24px', borderBottom:'1px solid var(--border)' }}>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--muted)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'12px' }}>
              Index a Paper
            </p>

            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="https://arxiv.org/abs/..."
              disabled={addStatus === 'loading'}
              style={{
                width:'100%', padding:'12px 14px',
                background:'var(--deep)',
                border:`1px solid ${addStatus === 'loading' ? 'var(--border-glow)' : 'var(--border)'}`,
                borderRadius:'8px',
                color:'var(--text)', fontSize:'13px',
                fontFamily:'var(--font-mono)',
                outline:'none', display:'block',
                marginBottom:'10px',
                transition:'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--border-glow)'}
              onBlur={e => e.target.style.borderColor = addStatus === 'loading' ? 'var(--border-glow)' : 'var(--border)'}
            />

            <button
              onClick={handleAdd}
              disabled={addStatus === 'loading' || !url.trim()}
              style={{
                width:'100%', padding:'12px',
                background: addStatus === 'loading' ? 'var(--elevated)' : 'var(--accent)',
                border:'none', borderRadius:'8px',
                color: addStatus === 'loading' ? 'var(--muted)' : '#fff',
                fontSize:'13px', fontWeight:500,
                fontFamily:'var(--font-body)',
                letterSpacing:'0.03em',
                transition:'all 0.2s',
                boxShadow: addStatus === 'loading' ? 'none' : '0 0 20px rgba(139,120,255,0.35)',
              }}
            >
              {addStatus === 'loading' ? 'Indexing paper...' : 'Add to Library'}
            </button>

            {addMsg && (
              <p style={{
                marginTop:'10px', fontSize:'12px',
                fontFamily:'var(--font-mono)',
                color: addStatus === 'success' ? 'var(--success)' : 'var(--danger)',
              }}>
                {addMsg}
              </p>
            )}
          </div>

          {/* Library list */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
            {loading ? (
              <p style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--faint)', textAlign:'center', paddingTop:'20px' }}>loading...</p>
            ) : papers.length === 0 ? (
              <div style={{ textAlign:'center', paddingTop:'30px' }}>
                <p style={{ fontFamily:'var(--font-display)', fontSize:'18px', fontStyle:'italic', color:'var(--faint)', marginBottom:'6px' }}>No papers yet</p>
                <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--faint)' }}>add your first above</p>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--muted)', letterSpacing:'0.12em', textTransform:'uppercase' }}>
                    {papers.length} Paper{papers.length > 1 ? 's' : ''}
                  </span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--faint)' }}>
                    {selectedIds.length === 0 ? 'all selected' : `${selectedIds.length} filtered`}
                  </span>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {papers.map(paper => {
                    const sel = selectedIds.includes(paper.arxiv_id)
                    return (
                      <div
                        key={paper.arxiv_id}
                        onClick={() => togglePaper(paper.arxiv_id)}
                        style={{
                          padding:'14px 16px',
                          background: sel ? 'var(--elevated)' : 'var(--deep)',
                          border:`1px solid ${sel ? 'var(--border-glow)' : 'var(--border)'}`,
                          borderRadius:'10px', cursor:'pointer',
                          position:'relative', transition:'all 0.2s',
                          boxShadow: sel ? '0 0 16px rgba(139,120,255,0.1), inset 0 0 20px rgba(139,120,255,0.03)' : 'none',
                        }}
                      >
                        {sel && <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:'3px', background:'var(--accent)', borderRadius:'0 3px 3px 0', boxShadow:'0 0 8px var(--accent)' }}/>}

                        <p style={{ fontSize:'13px', fontFamily:'var(--font-display)', fontWeight:400, lineHeight:1.4, color:'var(--text)', paddingRight:'24px', marginBottom:'8px' }}>
                          {paper.title?.length > 60 ? paper.title.slice(0,60)+'…' : paper.title}
                        </p>

                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--muted)' }}>
                            {paper.arxiv_id} · {paper.chunk_count} sections
                          </span>
                          <a href={paper.url} target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--accent)' }}>
                            open ↗
                          </a>
                        </div>

                        <button onClick={e => deletePaper(e, paper.arxiv_id)}
                          style={{ position:'absolute', top:'10px', right:'10px', background:'none', border:'none', color:'var(--faint)', fontSize:'16px', lineHeight:1, padding:'2px 5px', transition:'color 0.15s' }}
                          onMouseEnter={e => e.target.style.color='var(--danger)'}
                          onMouseLeave={e => e.target.style.color='var(--faint)'}
                        >×</button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding:'16px 24px',
            borderTop:'1px solid var(--border)',
            display:'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <div>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--muted)' }}>made by </span>
              <span style={{
                fontFamily:'var(--font-display)', fontSize:'16px', fontStyle:'italic',
                color:'var(--gold)', fontWeight:500,
                textShadow:'0 0 12px rgba(201,169,110,0.4)',
              }}>Aawaz</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'var(--success)', boxShadow:'0 0 8px var(--success)' }}/>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--success)' }}>live</span>
            </div>
          </div>
        </div>

        {/* ══ MAIN CHAT ══ */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>

          {/* Ambient glow top right */}
          <div style={{
            position:'absolute', top:'-100px', right:'-100px',
            width:'400px', height:'400px',
            background:'radial-gradient(circle, rgba(139,120,255,0.06) 0%, transparent 60%)',
            pointerEvents:'none', zIndex:0,
          }}/>

          {/* Mode bar */}
          <div style={{
            padding:'16px 32px',
            borderBottom:'1px solid var(--border)',
            display:'flex', gap:'8px', alignItems:'center',
            background:'var(--void)', position:'relative', zIndex:1,
          }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--muted)', marginRight:'8px', letterSpacing:'0.12em', textTransform:'uppercase' }}>
              Mode
            </span>
            {MODES.map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding:'8px 18px',
                border:`1px solid ${mode === m ? 'var(--border-glow)' : 'var(--border)'}`,
                borderRadius:'24px',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--muted)',
                fontSize:'12px', fontFamily:'var(--font-body)', fontWeight: mode === m ? 500 : 300,
                letterSpacing:'0.04em',
                transition:'all 0.2s',
                boxShadow: mode === m ? '0 0 16px rgba(139,120,255,0.4)' : 'none',
              }}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--muted)' }}>
                {selectedIds.length === 0 ? 'searching all papers' : `${selectedIds.length} paper${selectedIds.length > 1 ? 's' : ''} selected`}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'40px 48px', display:'flex', flexDirection:'column', gap:'32px', position:'relative', zIndex:1 }}>

            {messages.length === 0 && (
              <div style={{ margin:'auto', textAlign:'center', maxWidth:'420px' }}>
                <div style={{ marginBottom:'24px' }}>
                  <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'var(--elevated)', border:'1px solid var(--border-glow)', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 24px rgba(139,120,255,0.15)' }}>
                    <div style={{ width:'16px', height:'16px', borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 12px var(--accent)' }}/>
                  </div>
                  <p style={{ fontFamily:'var(--font-display)', fontSize:'32px', fontWeight:300, fontStyle:'italic', color:'var(--text)', letterSpacing:'0.01em', marginBottom:'10px', lineHeight:1.2 }}>
                    Ask anything about<br/>your papers
                  </p>
                  <p style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--muted)', letterSpacing:'0.1em', lineHeight:1.8 }}>
                    Add papers to your library →<br/>
                    Select papers or search all →<br/>
                    Choose a mode → Ask
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>

                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                  {msg.role === 'assistant' && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--gold)', boxShadow:'0 0 8px var(--gold)' }}/>}
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color: msg.role === 'user' ? 'var(--accent)' : 'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase' }}>
                    {msg.role === 'user' ? `You  ·  ${msg.mode}` : 'ArXiv Library'}
                  </span>
                  {msg.role === 'user' && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 8px var(--accent)' }}/>}
                </div>

                <div style={{
                  maxWidth:'75%', padding:'18px 22px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'var(--accent-dim)' : msg.isError ? 'rgba(248,113,113,0.08)' : 'var(--surface)',
                  border:`1px solid ${msg.role === 'user' ? 'var(--border-glow)' : msg.isError ? 'rgba(248,113,113,0.25)' : 'var(--border)'}`,
                  color: msg.isError ? 'var(--danger)' : 'var(--text)',
                  fontSize:'14px', lineHeight:1.8, whiteSpace:'pre-wrap', fontWeight:300,
                  boxShadow: msg.role === 'user' ? '0 4px 20px rgba(139,120,255,0.1)' : '0 4px 20px rgba(0,0,0,0.3)',
                }}>
                  {msg.content}
                </div>

                {msg.citations?.length > 0 && (
                  <div style={{ maxWidth:'75%', marginTop:'12px' }}>
                    <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--muted)', marginBottom:'8px', letterSpacing:'0.1em', textTransform:'uppercase' }}>
                      {msg.chunks} chunks retrieved · {msg.citations.length} source{msg.citations.length > 1 ? 's' : ''}
                    </p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                      {msg.citations.map((c,j) => (
                        <a key={j} href={c.url} target="_blank" rel="noreferrer" style={{
                          fontFamily:'var(--font-mono)', fontSize:'11px',
                          padding:'6px 12px',
                          background:'var(--gold-dim)',
                          border:'1px solid rgba(201,169,110,0.25)',
                          borderRadius:'6px', color:'var(--gold)',
                          transition:'all 0.15s',
                          boxShadow:'0 2px 8px rgba(201,169,110,0.08)',
                        }}>
                          [{j+1}] {c.title?.slice(0,28)}… · {c.section?.slice(0,18)}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {asking && (
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ display:'flex', gap:'5px' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width:'7px', height:'7px', borderRadius:'50%',
                      background:'var(--accent)',
                      animation:`bounce 1.2s ease-in-out ${i*0.15}s infinite`,
                      boxShadow:'0 0 8px var(--accent)',
                    }}/>
                  ))}
                </div>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--muted)', letterSpacing:'0.08em' }}>
                  Searching library...
                </span>
              </div>
            )}

            <div id="bottom"/>
          </div>

          {/* Input */}
          <div style={{
            padding:'20px 32px',
            borderTop:'1px solid var(--border)',
            background:'var(--void)',
            display:'flex', gap:'12px', alignItems:'center',
            position:'relative', zIndex:1,
          }}>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAsk()}
              placeholder="What would you like to know about these papers?"
              disabled={asking}
              style={{
                flex:1, padding:'14px 20px',
                background:'var(--deep)',
                border:'1px solid var(--border)',
                borderRadius:'10px',
                color:'var(--text)', fontSize:'14px',
                outline:'none', transition:'border-color 0.2s, box-shadow 0.2s',
                fontStyle: question ? 'normal' : 'italic',
              }}
              onFocus={e => { e.target.style.borderColor='var(--border-glow)'; e.target.style.boxShadow='0 0 16px rgba(139,120,255,0.1)' }}
              onBlur={e => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none' }}
            />
            <button
              onClick={handleAsk}
              disabled={asking || !question.trim()}
              style={{
                padding:'14px 28px',
                background: asking || !question.trim() ? 'var(--elevated)' : 'var(--accent)',
                border:'none', borderRadius:'10px',
                color: asking || !question.trim() ? 'var(--muted)' : '#fff',
                fontSize:'14px', fontWeight:500,
                fontFamily:'var(--font-body)',
                transition:'all 0.2s', whiteSpace:'nowrap',
                boxShadow: asking || !question.trim() ? 'none' : '0 0 20px rgba(139,120,255,0.4)',
              }}
            >
              Ask →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        * { scrollbar-width: thin; scrollbar-color: var(--faint) transparent; }
      `}</style>
    </>
  )
}
