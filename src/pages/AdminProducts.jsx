import { useState, useEffect } from 'react'
import { supabase, isNew } from '../lib/supabase'

const G = { bg:'#0C0C0C', gold:'#B8860B', border:'#1E1E1E', card:'#141414', text:'#E8E0D0', muted:'#555', green:'#2E6B4F', red:'#6B2D2D' }
const CATS = ['Murals','Mirrors','Vases','Art','Plants','Fragrance','Frames','Soft Furnish','Lighting','Hardware']
const CAT_ICON = { Murals:'🖼️', Mirrors:'🪞', Vases:'🏺', Art:'🎨', Plants:'🌿', Fragrance:'🕯️', Frames:'🖼️', 'Soft Furnish':'🛏️', Lighting:'💡', Hardware:'🔩' }

const BLANK = { name:'', category:'Murals', price:'', description:'', supplier:'', margin:'', image_url:'', is_available:true }

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState('list') // list | add | edit | export
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(BLANK)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [copied, setCopied]     = useState('')

  const load = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending:false })
    setProducts(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const notify = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  const saveProduct = async () => {
    if (!form.name || !form.price) return
    setSaving(true)
    if (editing) {
      await supabase.from('products').update(form).eq('id', editing)
      notify('✅ Product updated!')
    } else {
      await supabase.from('products').insert(form)
      notify('✅ Product added! 🆕 NEW badge automatic for 30 days.')
    }
    await load()
    setForm(BLANK); setEditing(null); setView('list'); setSaving(false)
  }

  const toggleAvail = async (p) => {
    await supabase.from('products').update({ is_available: !p.is_available }).eq('id', p.id)
    setProducts(prev => prev.map(x => x.id === p.id ? {...x, is_available: !x.is_available} : x))
  }

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
    notify('Product deleted.')
  }

  const startEdit = (p) => { setForm(p); setEditing(p.id); setView('add') }

  const waExport = () => {
    const avail = products.filter(p => p.is_available)
    return `*UA Interiors — Premium Product Catalogue*\n🏠 Mumbai & Palghar | WhatsApp for orders\n\n` +
      avail.map((p,i) => `${i+1}. *${p.name}*${isNew(p.created_at) ? ' 🆕' : ''}\n   💰 ${p.price}\n   📁 ${p.category}`).join('\n\n') +
      `\n\n📞 Reply to this message to order`
  }

  const fbFeedXml = () => {
    const avail = products.filter(p => p.is_available)
    return `<?xml version="1.0"?>\n<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n<channel>\n<title>UA Interiors</title>\n${avail.map(p => `<item>
  <g:id>${p.id}</g:id>
  <g:title>${p.name}</g:title>
  <g:description>${p.description || p.name}</g:description>
  <g:link>https://uainteriors.in/shop</g:link>
  <g:image_link>${p.image_url || 'https://uainteriors.in/placeholder.jpg'}</g:image_link>
  <g:availability>in stock</g:availability>
  <g:price>999 INR</g:price>
  <g:brand>UA Interiors</g:brand>
  <g:google_product_category>Home &amp; Garden > Decor</g:google_product_category>
</item>`).join('\n')}\n</channel>\n</rss>`
  }

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key); setTimeout(() => setCopied(''), 2500)
  }

  const filtered = products.filter(p =>
    (catFilter === 'All' || p.category === catFilter) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  )

  const newCount = products.filter(p => isNew(p.created_at)).length

  return (
    <div style={{ maxWidth:480, margin:'0 auto', padding:14 }}>

      {/* Notification */}
      {msg && (
        <div style={{ background:'#0D1F15', border:'1px solid #2E6B4F', borderRadius:10, padding:'9px 13px', marginBottom:12, fontSize:12, color:'#7CB87A' }}>{msg}</div>
      )}

      {/* View: LIST */}
      {view === 'list' && (
        <>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
            {[
              { l:'Total', v:products.length, c:G.gold },
              { l:'Available', v:products.filter(p=>p.is_available).length, c:G.green },
              { l:'🆕 NEW', v:newCount, c:'#FF4400' },
            ].map((s,i) => (
              <div key={i} style={{ background:G.card, borderRadius:10, padding:12, textAlign:'center', border:`1px solid ${s.c}33` }}>
                <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:9, color:G.muted }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            <button onClick={() => { setForm(BLANK); setEditing(null); setView('add') }}
              style={{ flex:1, padding:'10px', borderRadius:10, border:`1px solid ${G.gold}`, background:`${G.gold}22`, color:G.gold, fontSize:12, fontWeight:700, cursor:'pointer' }}>
              ➕ Add Product
            </button>
            <button onClick={() => setView('export')}
              style={{ flex:1, padding:'10px', borderRadius:10, border:`1px solid ${G.border}`, background:G.card, color:G.muted, fontSize:12, fontWeight:600, cursor:'pointer' }}>
              📤 Export
            </button>
          </div>

          {/* Search + Cat filter */}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search..."
            style={{ width:'100%', background:G.card, border:`1px solid ${G.border}`, borderRadius:10, padding:'9px 12px', color:G.text, fontSize:12, outline:'none', marginBottom:8, boxSizing:'border-box' }} />
          <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:14, scrollbarWidth:'none' }}>
            {['All',...CATS].map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                style={{ flexShrink:0, padding:'4px 9px', borderRadius:16, border:`1px solid ${catFilter === c ? G.gold : G.border}`, background: catFilter === c ? `${G.gold}22` : G.card, color: catFilter === c ? G.gold : G.muted, fontSize:9, cursor:'pointer' }}>{c}</button>
            ))}
          </div>

          {/* Product list */}
          {loading && <div style={{ color:G.muted, textAlign:'center', padding:30 }}>Loading...</div>}
          {filtered.map(p => (
            <div key={p.id} style={{ background:G.card, borderRadius:12, padding:'11px 13px', marginBottom:8, border:`1px solid ${p.is_available ? G.border : '#111'}`, opacity: p.is_available ? 1 : 0.5 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:5, alignItems:'center', flexWrap:'wrap', marginBottom:2 }}>
                    <span style={{ fontSize:13 }}>{CAT_ICON[p.category]}</span>
                    <span style={{ fontSize:12, fontWeight:600 }}>{p.name}</span>
                    {isNew(p.created_at) && p.is_available && (
                      <span style={{ fontSize:7, background:'#FF4400', color:'#fff', padding:'1px 5px', borderRadius:6, fontWeight:800 }}>🆕 NEW</span>
                    )}
                    {!p.is_available && (
                      <span style={{ fontSize:7, background:'#333', color:'#666', padding:'1px 5px', borderRadius:6 }}>OUT OF STOCK</span>
                    )}
                  </div>
                  <div style={{ fontSize:10, color:G.muted }}>{p.category} • <span style={{ color:G.gold }}>{p.price}</span> • {p.margin} margin</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:6, marginTop:8 }}>
                <button onClick={() => startEdit(p)} style={{ flex:1, padding:'6px', borderRadius:8, border:`1px solid ${G.border}`, background:'none', color:G.gold, fontSize:10, cursor:'pointer' }}>✏️ Edit</button>
                <button onClick={() => toggleAvail(p)} style={{ flex:1, padding:'6px', borderRadius:8, border:`1px solid ${G.border}`, background:'none', color: p.is_available ? G.muted : G.green, fontSize:10, cursor:'pointer' }}>
                  {p.is_available ? '❌ Mark OOS' : '✅ Mark Available'}
                </button>
                <button onClick={() => deleteProduct(p.id)} style={{ padding:'6px 10px', borderRadius:8, border:`1px solid #300`, background:'none', color:'#AA4444', fontSize:10, cursor:'pointer' }}>🗑️</button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* View: ADD / EDIT */}
      {view === 'add' && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>{editing ? '✏️ Edit Product' : '➕ New Product'}</div>
            <button onClick={() => { setView('list'); setForm(BLANK); setEditing(null) }}
              style={{ background:'none', border:'none', color:G.muted, fontSize:11, cursor:'pointer' }}>← Back</button>
          </div>

          {[
            { l:'Product Name *', k:'name', ph:'e.g. Arched Gold Mirror 5ft', type:'text' },
            { l:'Price *', k:'price', ph:'e.g. ₹8,500 onwards', type:'text' },
            { l:'Supplier', k:'supplier', ph:'e.g. IndiaMart / Magicdecor', type:'text' },
            { l:'Margin %', k:'margin', ph:'e.g. 50%', type:'text' },
            { l:'Image URL', k:'image_url', ph:'https://... (leave blank if no image)', type:'url' },
          ].map(f => (
            <div key={f.k} style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:G.muted, marginBottom:5 }}>{f.l}</div>
              <input type={f.type} value={form[f.k] || ''} onChange={e => setForm({...form, [f.k]:e.target.value})}
                placeholder={f.ph}
                style={{ width:'100%', background:G.card, border:`1px solid ${G.border}`, borderRadius:10, padding:'10px 12px', color:G.text, fontSize:12, outline:'none', boxSizing:'border-box' }} />
            </div>
          ))}

          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, color:G.muted, marginBottom:7 }}>Category</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {CATS.map(c => (
                <button key={c} onClick={() => setForm({...form, category:c})}
                  style={{ padding:'5px 10px', borderRadius:14, border:`1px solid ${form.category===c ? G.gold : G.border}`, background: form.category===c ? `${G.gold}22` : G.card, color: form.category===c ? G.gold : G.muted, fontSize:10, cursor:'pointer', fontWeight: form.category===c ? 700 : 400 }}>
                  {CAT_ICON[c]} {c}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, color:G.muted, marginBottom:5 }}>Description</div>
            <textarea value={form.description || ''} onChange={e => setForm({...form, description:e.target.value})}
              placeholder="Short description (2-3 lines)"
              rows={3}
              style={{ width:'100%', background:G.card, border:`1px solid ${G.border}`, borderRadius:10, padding:'10px 12px', color:G.text, fontSize:12, outline:'none', resize:'none', boxSizing:'border-box' }} />
          </div>

          <div style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
            <input type="checkbox" checked={form.is_available} onChange={e => setForm({...form, is_available:e.target.checked})} id="avail" />
            <label htmlFor="avail" style={{ fontSize:12, color:G.text, cursor:'pointer' }}>Available for sale</label>
          </div>

          {!editing && (
            <div style={{ background:'#0D1F15', borderRadius:8, padding:'9px 12px', marginBottom:14, borderLeft:`3px solid ${G.green}` }}>
              <div style={{ fontSize:11, color:'#7CB87A' }}>🆕 Naya product auto-tagged NEW for 30 days on shop page + WhatsApp export.</div>
            </div>
          )}

          <button onClick={saveProduct} disabled={saving || !form.name || !form.price}
            style={{ width:'100%', padding:12, borderRadius:10, border:'none', background: form.name && form.price ? G.gold : G.card, color: form.name && form.price ? '#000' : G.muted, fontSize:13, fontWeight:800, cursor: form.name && form.price ? 'pointer' : 'default' }}>
            {saving ? 'Saving...' : editing ? '✅ Update Product' : '➕ Add Product'}
          </button>
        </>
      )}

      {/* View: EXPORT */}
      {view === 'export' && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>📤 Export Catalogue</div>
            <button onClick={() => setView('list')} style={{ background:'none', border:'none', color:G.muted, fontSize:11, cursor:'pointer' }}>← Back</button>
          </div>

          {/* WhatsApp */}
          <div style={{ background:G.card, borderRadius:12, padding:14, marginBottom:12, border:'1px solid #25D36644' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div>
                <div style={{ fontSize:10, color:'#25D366', fontWeight:700, letterSpacing:1.5 }}>WHATSAPP BROADCAST</div>
                <div style={{ fontSize:11, color:G.muted }}>Ready-to-paste with 🆕 tags</div>
              </div>
              <button onClick={() => copy(waExport(), 'wa')}
                style={{ padding:'8px 14px', borderRadius:8, border:'1px solid #25D366', background: copied==='wa' ? '#25D36622' : 'none', color:'#25D366', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                {copied==='wa' ? '✅ Copied!' : 'Copy'}
              </button>
            </div>
            <div style={{ background:'#0F0F0F', borderRadius:8, padding:10, maxHeight:100, overflow:'hidden', fontSize:10, color:G.muted, lineHeight:1.6 }}>
              {waExport().substring(0,200)}...
            </div>
          </div>

          {/* Facebook XML Feed */}
          <div style={{ background:G.card, borderRadius:12, padding:14, marginBottom:12, border:'1px solid #1877F244' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div>
                <div style={{ fontSize:10, color:'#1877F2', fontWeight:700, letterSpacing:1.5 }}>FACEBOOK PRODUCT FEED XML</div>
                <div style={{ fontSize:11, color:G.muted }}>Upload to FB Commerce Manager</div>
              </div>
              <button onClick={() => copy(fbFeedXml(), 'fb')}
                style={{ padding:'8px 14px', borderRadius:8, border:'1px solid #1877F2', background: copied==='fb' ? '#1877F222' : 'none', color:'#1877F2', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                {copied==='fb' ? '✅ Copied!' : 'Copy XML'}
              </button>
            </div>
            <div style={{ background:'#0F0F0F', borderRadius:8, padding:'8px 10px', fontSize:10, color:G.muted, lineHeight:1.6 }}>
              📌 Facebook Page → Commerce Manager → Catalog → Data Feed → Upload this XML file → Schedule daily update
            </div>
          </div>

          {/* Stats */}
          <div style={{ background:G.card, borderRadius:12, padding:14, border:`1px solid ${G.border}` }}>
            <div style={{ fontSize:10, color:G.gold, fontWeight:700, letterSpacing:1.5, marginBottom:10 }}>CATALOGUE STATS</div>
            {[
              { l:'Total products', v:products.length },
              { l:'Available (published)', v:products.filter(p=>p.is_available).length },
              { l:'Out of stock (hidden)', v:products.filter(p=>!p.is_available).length },
              { l:'🆕 NEW this month', v:newCount },
            ].map((s,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom: i<3 ? `1px solid ${G.border}` : 'none' }}>
                <span style={{ fontSize:11, color:G.muted }}>{s.l}</span>
                <span style={{ fontSize:12, fontWeight:700, color:G.gold }}>{s.v}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
