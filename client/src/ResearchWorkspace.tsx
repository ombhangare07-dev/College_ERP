import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { BookOpen, Plus, Search, Pencil, Trash2, RefreshCw, X, CheckCircle2, FileText } from 'lucide-react'

const API = `${import.meta.env.VITE_API_URL}/api/research`
type PublicationStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Published' | 'Rejected'
interface Publication {
  id: number; title: string; authors: string; department: string; publication_type: string;
  journal: string | null; doi: string | null; publication_date: string | null; status: PublicationStatus;
  abstract: string | null; created_at?: string
}
type Form = { title: string; authors: string; department: string; publication_type: string; journal: string; doi: string; publication_date: string; status: PublicationStatus; abstract: string }
const empty: Form = { title: '', authors: '', department: '', publication_type: 'Journal Article', journal: '', doi: '', publication_date: '', status: 'Draft', abstract: '' }
const statuses: PublicationStatus[] = ['Draft', 'Submitted', 'Under Review', 'Published', 'Rejected']
const currencyDate = (date: string | null) => date ? new Date(`${date.slice(0,10)}T00:00:00`).toLocaleDateString() : '—'

export default function ResearchWorkspace() {
  const [items, setItems] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Publication | null>(null)
  const [form, setForm] = useState<Form>(empty)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(API)
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message || 'Could not load research records.')
      setItems(Array.isArray(body) ? body : [])
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not connect to the research API.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => items.filter(p => {
    const text = `${p.title} ${p.authors} ${p.department} ${p.journal || ''} ${p.doi || ''}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (statusFilter === 'All' || p.status === statusFilter)
  }), [items, query, statusFilter])
  const counts = useMemo(() => ({ total: items.length, published: items.filter(p => p.status === 'Published').length, inProgress: items.filter(p => ['Submitted','Under Review'].includes(p.status)).length, drafts: items.filter(p => p.status === 'Draft').length }), [items])

  function openNew() { setEditing(null); setForm(empty); setError(''); setMessage(''); setModal(true) }
  function openEdit(p: Publication) { setEditing(p); setForm({ title:p.title, authors:p.authors, department:p.department, publication_type:p.publication_type, journal:p.journal || '', doi:p.doi || '', publication_date:p.publication_date?.slice(0,10) || '', status:p.status, abstract:p.abstract || '' }); setError(''); setMessage(''); setModal(true) }
  async function submit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError(''); setMessage('')
    try {
      const res = await fetch(editing ? `${API}/${editing.id}` : API, { method: editing ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message || 'Could not save research record.')
      setMessage(editing ? 'Research record updated.' : 'Research record added.')
      setModal(false); await load()
    } catch(e) { setError(e instanceof Error ? e.message : 'Save failed.') }
    finally { setSaving(false) }
  }
  async function remove(p: Publication) {
    if (!window.confirm(`Delete “${p.title}”? This cannot be undone.`)) return
    setError(''); setMessage('')
    try { const res = await fetch(`${API}/${p.id}`, {method:'DELETE'}); const body = await res.json().catch(() => ({})); if (!res.ok) throw new Error(body.message || 'Delete failed.'); setMessage('Research record deleted.'); await load() }
    catch(e) { setError(e instanceof Error ? e.message : 'Delete failed.') }
  }
  const field = (key: keyof Form, value: string) => setForm(old => ({...old, [key]:value}))
  return <section className="academics-module">
    <div className="academics-summary">
      <article className="academics-stat"><span>Total research records</span><strong>{counts.total}</strong><small>Saved in PostgreSQL</small></article>
      <article className="academics-stat"><span>Published</span><strong>{counts.published}</strong><small>Publication status</small></article>
      <article className="academics-stat"><span>In progress</span><strong>{counts.inProgress}</strong><small>Submitted or under review</small></article>
      <article className="academics-stat"><span>Drafts</span><strong>{counts.drafts}</strong><small>Not yet submitted</small></article>
    </div>
    {message && <div className="academics-alert academics-success" role="status"><CheckCircle2 size={17}/><span>{message}</span><button onClick={() => setMessage('')} aria-label="Dismiss message"><X size={15}/></button></div>}
    {error && <div className="academics-alert academics-error" role="alert"><span>{error}</span><button className="secondary-button" onClick={() => void load()}>Retry</button></div>}
    <article className="panel academics-panel">
      <div className="academics-toolbar"><div><h2>Research & Publications</h2><p>Track research projects, papers, journals, DOI details, and publication progress.</p></div>
<button
  type="button"
  className="primary-button"
  onClick={() => {
    console.log("Add research clicked");
    openNew();
  }}
>
  <Plus size={16} />
  Add research
</button>
</div>
      <div className="research-filters" style={{display:'flex',gap:12,flexWrap:'wrap',padding:'0 0 18px'}}>
        <label style={{display:'flex',alignItems:'center',gap:8,flex:'1 1 220px'}}><Search size={16}/><input aria-label="Search research records" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search title, author, department, DOI…" /></label>
        <select aria-label="Filter by status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>All</option>{statuses.map(x=><option key={x}>{x}</option>)}</select>
        <button className="secondary-button" onClick={()=>void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button>
      </div>
      {loading ? <div className="academics-empty"><div className="loading-spinner"/><p>Loading research records…</p></div> : filtered.length === 0 ? <div className="academics-empty"><BookOpen size={34}/><strong>{items.length ? 'No matching research records' : 'Your research workspace is ready'}</strong><p>{items.length ? 'Try changing your search or status filter.' : 'Add a paper or project to begin tracking your institution’s research activity.'}</p>{items.length === 0 && <button className="primary-button" onClick={openNew}><Plus size={16}/> Add first record</button>}</div> : <div className="academics-table-wrap"><table className="academics-table"><thead><tr><th>Publication</th><th>Authors</th><th>Department</th><th>Type / Journal</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><div className="academics-name"><strong>{p.title}</strong><span>{p.doi ? `DOI: ${p.doi}` : 'No DOI added'}</span></div></td><td>{p.authors}</td><td>{p.department}</td><td><div className="academics-name"><strong>{p.publication_type}</strong><span>{p.journal || '—'}</span></div></td><td>{currencyDate(p.publication_date)}</td><td><span className={`faculty-status ${p.status === 'Published' ? 'faculty-status-active' : 'faculty-status-inactive'}`}>{p.status}</span></td><td><div className="student-actions"><button className="student-action edit-action" onClick={()=>openEdit(p)} title="Edit research" aria-label={`Edit ${p.title}`}><Pencil size={16}/></button><button className="student-action delete-action" onClick={()=>void remove(p)} title="Delete research" aria-label={`Delete ${p.title}`}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>}
      <div className="academics-footer"><span>Showing {filtered.length} of {items.length} records</span><span>Research data is stored in PostgreSQL</span></div>
    </article>
    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="research-modal-title"><div className="modal-header"><div><h2 id="research-modal-title">{editing ? 'Edit research record' : 'Add research record'}</h2><p>Enter publication details below.</p></div><button className="student-action" onClick={()=>setModal(false)} aria-label="Close"><X size={18}/></button></div>
      <form onSubmit={submit} className="student-form"><label>Title *<input required maxLength={300} value={form.title} onChange={e=>field('title',e.target.value)} /></label><label>Authors *<input required maxLength={500} placeholder="Names separated by commas" value={form.authors} onChange={e=>field('authors',e.target.value)} /></label><div className="form-grid"><label>Department *<input required value={form.department} onChange={e=>field('department',e.target.value)} /></label><label>Publication type<select value={form.publication_type} onChange={e=>field('publication_type',e.target.value)}><option>Journal Article</option><option>Conference Paper</option><option>Book</option><option>Book Chapter</option><option>Patent</option><option>Research Project</option><option>Thesis</option><option>Other</option></select></label><label>Journal / Publisher<input value={form.journal} onChange={e=>field('journal',e.target.value)} /></label><label>DOI<input value={form.doi} onChange={e=>field('doi',e.target.value)} /></label><label>Publication date<input type="date" value={form.publication_date} onChange={e=>field('publication_date',e.target.value)} /></label><label>Status<select value={form.status} onChange={e=>field('status',e.target.value)}>{statuses.map(x=><option key={x}>{x}</option>)}</select></label></div><label>Abstract / Notes<textarea rows={4} value={form.abstract} onChange={e=>field('abstract',e.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setModal(false)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : <><FileText size={16}/>{editing ? 'Save changes' : 'Save research'}</>}</button></div></form></section></div>}
  </section>
}
