import { useState, useEffect } from 'react'
import { supabase, isNew } from '../lib/supabase'

const G = { bg:'#0C0C0C', gold:'#B8860B', border:'#1E1E1E', card:'#141414', text:'#E8E0D0', muted:'#555', green:'#2E6B4F', red:'#6B2D2D' }
const CATS = ['Murals','Mirrors','Vases','Art','Plants','Fragrance','Frames','Soft Furnish','Lighting','Hardware']
const CAT_ICON = { Murals:'🖼️', Mirrors:'🪞', Vases:'🏺', Art:'🎨', Plants:'🌿', Fragrance:'🕯️', Frames:'🖼️', 'Soft Furnish':'🛏️', Lighting:'💡', Hardware:'🔩' }

const BLANK = { name:'', category:'Murals', price:'', description:'', supplier:'', margin:'', image_url:'', is_available:true }

const sanitizeText = (value='') => value.replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim()

const buildFallbackMetadata = (fileName, category) => {
  const base = sanitizeText(fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9\s]/g,' '))
  const words = base.split(' ').filter(Boolean)
  const meaningful = words.filter(w => !['jpg','jpeg','png','webp','img','image','photo','product','decor','item','piece','modern','luxury','premium','home','interior','new'].includes(w.toLowerCase()))
  const descriptor = meaningful.slice(0,3).join(' ') || 'Elegance'
  const name = `${category} ${descriptor}`.trim()
  return {
    name: name.length > 55 ? `${name.slice(0, 52).trimEnd()}...` : name,
    description: `Premium ${category.toLowerCase()} piece designed to add elegance and character to modern interiors.`
  }
}

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
  const [aiGenerating, setAiGenerating] = useState(false)

  const load = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const toDataUrl = (inputFile) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(inputFile)
    })

    setAiGenerating(true)
    try {
      const dataUrl = await toDataUrl(file)
      setForm(prev => ({ ...prev, image_url: dataUrl }))

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      let generated = null

      if (apiKey) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method:'POST',
            headers:{
              'Content-Type':'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model:'gpt-4o-mini',
              temperature:0.7,
              max_tokens:180,
              messages:[
                { role:'system', content:'You are a premium interior decor catalog assistant. Return ONLY valid JSON with keys name and description.' },
                { role:'user', content:[
                  { type:'text', text:`Create a short premium product name and description for this interior decor product. Category: ${form.category || 'Decor'}. Keep the product name under 60 characters and the description under 140 characters. Return only JSON.` },
                  { type:'image_url', image_url: { url: dataUrl } }
                ] }
              ]
            })
          })

          const payload = await response.json()
          const content = payload.choices?.[0]?.message?.content || ''
          const cleaned = content.replace(/```json|```/g, '').trim()
          if (cleaned) {
            const parsed = JSON.parse(cleaned)
            generated = {
              name: parsed?.name?.trim() || '',
              description: parsed?.description?.trim() || ''
            }
          }
        } catch (aiErr) {
          console.warn('AI image generation failed, using fallback text.', aiErr)
        }
      }

      const fallback = buildFallbackMetadata(file.name, form.category || 'Decor')
      setForm(prev => ({
        ...prev,
        name: generated?.name || prev.name || fallback.name,
        description: generated?.description || prev.description || fallback.description,
        image_url: dataUrl
      }))
      notify('✨ Product name and description generated from the image.')
    } catch (err) {
      console.error(err)
      notify('Unable to process image right now.')
    } finally {
      setAiGenerating(false)
    }
  }

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
    <div style={{ maxWidth:980, margin:'0 auto', padding:'18px 16px 28px', width:'100%' }}>

      {/* Notification */}
      {msg && (
        <div style={{ background:'#0D1F15', border:'1px solid #2E6B4F', borderRadius:10, padding:'9px 13px', marginBottom:12, fontSize:12, color:'#7CB87A' }}>{msg}</div>
      )}

      {/* View: LIST */}
      {view === 'list' && (
        <>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:10, marginBottom:16 }}>
            {[
              { l:'Total', v:products.length, c:G.gold },
              { l:'Available', v:products.filter(p=>p.is_available).length, c:G.green },
              { l:'🆕 NEW', v:newCount, c:'#FF4400' },
            ].map((s,i) => (
              <div key={i} style={{ background:'linear-gradient(135deg, rgba(20,20,20,0.95), rgba(12,12,12,0.95))', borderRadius:14, padding:'14px 12px', textAlign:'center', border:`1px solid ${s.c}33`, boxShadow:'0 8px 24px rgba(0,0,0,0.22)' }}>
                <div style={{ fontSize:24, fontWeight:900, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11, color:G.muted, marginTop:4, fontWeight:700 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            <button onClick={() => { setForm(BLANK); setEditing(null); setView('add') }}
              style={{ flex:'1 1 220px', padding:'12px 14px', borderRadius:12, border:`1px solid ${G.gold}`, background:`${G.gold}22`, color:G.gold, fontSize:14, fontWeight:800, cursor:'pointer' }}>
              ➕ Add Product
            </button>
            <button onClick={() => setView('export')}
              style={{ flex:'1 1 220px', padding:'12px 14px', borderRadius:12, border:`1px solid ${G.border}`, background:G.card, color:G.muted, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              📤 Export
            </button>
          </div>

          {/* Search + Cat filter */}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search..."
            style={{ width:'100%', background:G.card, border:`1px solid ${G.border}`, borderRadius:14, padding:'12px 14px', color:G.text, fontSize:14, outline:'none', marginBottom:10, boxSizing:'border-box' }} />
          <div style={{ display:'flex', gap:8, overflowX:'auto', marginBottom:16, scrollbarWidth:'none', paddingBottom:4 }}>
            {['All',...CATS].map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                style={{ flexShrink:0, padding:'6px 12px', borderRadius:999, border:`1px solid ${catFilter === c ? G.gold : G.border}`, background: catFilter === c ? `${G.gold}22` : G.card, color: catFilter === c ? G.gold : G.muted, fontSize:12, cursor:'pointer' }}>{c}</button>
            ))}
          </div>

          {/* Product list */}
          {loading && <div style={{ color:G.muted, textAlign:'center', padding:30 }}>Loading...</div>}
          {!loading && !supabase && <div style={{ color:G.muted, textAlign:'center', padding:30 }}>Supabase is not configured. Connect your environment values to use the admin panel.</div>}
          {filtered.map(p => (
            <div key={p.id} style={{ background:'linear-gradient(135deg, rgba(20,20,20,0.95), rgba(12,12,12,0.95))', borderRadius:16, padding:'14px 15px', marginBottom:10, border:`1px solid ${p.is_available ? G.border : '#111'}`, opacity: p.is_available ? 1 : 0.7, boxShadow:'0 8px 24px rgba(0,0,0,0.22)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:5, alignItems:'center', flexWrap:'wrap', marginBottom:2 }}>
                    <span style={{ fontSize:15 }}>{CAT_ICON[p.category]}</span>
                    <span style={{ fontSize:15, fontWeight:800 }}>{p.name}</span>
                    {isNew(p.created_at) && p.is_available && (
                      <span style={{ fontSize:7, background:'#FF4400', color:'#fff', padding:'1px 5px', borderRadius:6, fontWeight:800 }}>🆕 NEW</span>
                    )}
                    {!p.is_available && (
                      <span style={{ fontSize:7, background:'#333', color:'#666', padding:'1px 5px', borderRadius:6 }}>OUT OF STOCK</span>
                    )}
                  </div>
                  <div style={{ fontSize:12, color:G.muted, marginTop:4, fontWeight:600 }}>{p.category} • <span style={{ color:G.gold }}>{p.price}</span> • {p.margin} margin</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:6, marginTop:8 }}>
                <button onClick={() => startEdit(p)} style={{ flex:1, padding:'8px 10px', borderRadius:10, border:`1px solid ${G.border}`, background:'none', color:G.gold, fontSize:12, cursor:'pointer' }}>✏️ Edit</button>
                <button onClick={() => toggleAvail(p)} style={{ flex:1, padding:'8px 10px', borderRadius:10, border:`1px solid ${G.border}`, background:'none', color: p.is_available ? G.muted : G.green, fontSize:12, cursor:'pointer' }}>
                  {p.is_available ? '❌ Mark OOS' : '✅ Mark Available'}
                </button>
                <button onClick={() => deleteProduct(p.id)} style={{ padding:'8px 10px', borderRadius:10, border:`1px solid #300`, background:'none', color:'#AA4444', fontSize:12, cursor:'pointer' }}>🗑️</button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* View: ADD / EDIT */}
      {view === 'add' && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ fontSize:18, fontWeight:800 }}>{editing ? '✏️ Edit Product' : '➕ New Product'}</div>
            <button onClick={() => { setView('list'); setForm(BLANK); setEditing(null) }}
              style={{ background:'none', border:'none', color:G.muted, fontSize:13, cursor:'pointer' }}>← Back</button>
          </div>

          {[
            { l:'Product Name *', k:'name', ph:'e.g. Arched Gold Mirror 5ft', type:'text' },
            { l:'Price *', k:'price', ph:'e.g. ₹8,500 onwards', type:'text' },
            { l:'Supplier', k:'supplier', ph:'e.g. IndiaMart / Magicdecor', type:'text' },
            { l:'Margin %', k:'margin', ph:'e.g. 50%', type:'text' },
            { l:'Image URL', k:'image_url', ph:'https://... (leave blank if no image)', type:'url' },
          ].map(f => (
            <div key={f.k} style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, color:G.muted, marginBottom:6 }}>{f.l}</div>
              <input type={f.type} value={form[f.k] || ''} onChange={e => setForm({...form, [f.k]:e.target.value})}
                placeholder={f.ph}
                style={{ width:'100%', background:G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:'12px 14px', color:G.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
            </div>
          ))}

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:G.muted, marginBottom:8 }}>Upload image to auto-generate title & description</div>
            <input type="file" accept="image/*" onChange={handleImageUpload}
              style={{ width:'100%', background:G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:'10px 12px', color:G.text, fontSize:13, boxSizing:'border-box' }} />
            {aiGenerating && <div style={{ fontSize:12, color:G.gold, marginTop:8 }}>🤖 Generating product details from the image...</div>}
            {form.image_url && (
              <div style={{ marginTop:10 }}>
                <img src={form.image_url} alt="Product preview" style={{ width:'100%', maxHeight:220, objectFit:'cover', borderRadius:12, border:`1px solid ${G.border}` }} />
              </div>
            )}
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:G.muted, marginBottom:8 }}>Category</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {CATS.map(c => (
                <button key={c} onClick={() => setForm({...form, category:c})}
                  style={{ padding:'7px 12px', borderRadius:999, border:`1px solid ${form.category===c ? G.gold : G.border}`, background: form.category===c ? `${G.gold}22` : G.card, color: form.category===c ? G.gold : G.muted, fontSize:12, cursor:'pointer', fontWeight: form.category===c ? 700 : 400 }}>
                  {CAT_ICON[c]} {c}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:G.muted, marginBottom:6 }}>Description</div>
            <textarea value={form.description || ''} onChange={e => setForm({...form, description:e.target.value})}
              placeholder="Short description (2-3 lines)"
              rows={4}
              style={{ width:'100%', background:G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:'12px 14px', color:G.text, fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box' }} />
          </div>

          <div style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
            <input type="checkbox" checked={form.is_available} onChange={e => setForm({...form, is_available:e.target.checked})} id="avail" />
            <label htmlFor="avail" style={{ fontSize:14, color:G.text, cursor:'pointer' }}>Available for sale</label>
          </div>

          {!editing && (
            <div style={{ background:'#0D1F15', borderRadius:10, padding:'10px 12px', marginBottom:14, borderLeft:`3px solid ${G.green}` }}>
              <div style={{ fontSize:13, color:'#7CB87A' }}>🆕 Naya product auto-tagged NEW for 30 days on shop page + WhatsApp export.</div>
            </div>
          )}

          <button onClick={saveProduct} disabled={saving || !form.name || !form.price}
            style={{ width:'100%', padding:'13px 14px', borderRadius:12, border:'none', background: form.name && form.price ? G.gold : G.card, color: form.name && form.price ? '#000' : G.muted, fontSize:15, fontWeight:900, cursor: form.name && form.price ? 'pointer' : 'default' }}>
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
