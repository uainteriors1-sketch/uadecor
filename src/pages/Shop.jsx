import { useState, useEffect } from 'react'
import { supabase, isNew, waOrderLink } from '../lib/supabase'

const G = { bg:'#0C0C0C', gold:'#B8860B', border:'#1E1E1E', card:'#141414', text:'#E8E0D0', muted:'#555', green:'#2E6B4F' }
const CATS = ['All','Murals','Mirrors','Vases','Art','Plants','Fragrance','Frames','Soft Furnish','Lighting','Hardware']
const CAT_ICON = { Murals:'🖼️', Mirrors:'🪞', Vases:'🏺', Art:'🎨', Plants:'🌿', Fragrance:'🕯️', Frames:'🖼️', 'Soft Furnish':'🛏️', Lighting:'💡', Hardware:'🔩' }
const WA_NUMBER = '91XXXXXXXXXX' // REPLACE with actual number

export default function Shop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false })
      if (!error) setProducts(data || [])
      setLoading(false)
    })()
  }, [])

  const filtered = products.filter(p =>
    (cat === 'All' || p.category === cat) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  )

  const newCount = products.filter(p => isNew(p.created_at)).length

  return (
    <div style={{ background:G.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(160deg,#1A1200,#0C0C0C)', padding:'20px 16px 0', borderBottom:`1px solid ${G.border}`, position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:9, color:G.gold, letterSpacing:3, marginBottom:2 }}>PREMIUM HOME DECOR</div>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>UA Interiors</div>
            <div style={{ fontSize:10, color:G.muted }}>Mumbai & Palghar Delivery 🚚</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <a href={`https://wa.me/${WA_NUMBER}?text=Hi UA Interiors, I want to see your catalogue`}
               target="_blank" rel="noreferrer"
               style={{ display:'block', textDecoration:'none', background:G.green, color:'#fff', padding:'8px 12px', borderRadius:10, fontSize:11, fontWeight:700 }}>
              💬 WhatsApp
            </a>
            {newCount > 0 && (
              <div style={{ fontSize:9, color:'#FF4400', marginTop:4, fontWeight:700 }}>🆕 {newCount} New Arrivals</div>
            )}
          </div>
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search products..."
          style={{ width:'100%', background:'#141414', border:`1px solid ${G.border}`, borderRadius:10, padding:'9px 12px', color:G.text, fontSize:12, outline:'none', marginBottom:10, boxSizing:'border-box' }} />

        {/* Category filter */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:10, scrollbarWidth:'none' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ flexShrink:0, padding:'5px 11px', borderRadius:20, border:`1px solid ${cat === c ? G.gold : G.border}`, background: cat === c ? `${G.gold}22` : G.card, color: cat === c ? G.gold : G.muted, fontSize:10, fontWeight: cat === c ? 700 : 400, cursor:'pointer', whiteSpace:'nowrap' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div style={{ padding:14 }}>
        {loading && (
          <div style={{ textAlign:'center', padding:40, color:G.muted, fontSize:13 }}>Loading products...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:40, color:G.muted, fontSize:13 }}>No products in this category</div>
        )}

        {!loading && filtered.map(p => {
          const _new = isNew(p.created_at)
          const isOpen = expanded === p.id
          return (
            <div key={p.id} style={{ marginBottom:10, border:`1px solid ${isOpen ? G.gold : G.border}`, borderRadius:14, overflow:'hidden' }}>
              {/* Product image or icon */}
              {p.image_url && (
                <img src={p.image_url} alt={p.name}
                  style={{ width:'100%', height:180, objectFit:'cover', display:'block' }} />
              )}
              {!p.image_url && (
                <div style={{ background:`${G.gold}11`, height:80, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>
                  {CAT_ICON[p.category] || '📦'}
                </div>
              )}

              <div style={{ padding:'12px 14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', marginBottom:3 }}>
                      <span style={{ fontSize:13, fontWeight:700 }}>{p.name}</span>
                      {_new && <span style={{ fontSize:8, background:'#FF4400', color:'#fff', padding:'1px 5px', borderRadius:8, fontWeight:800, flexShrink:0 }}>🆕 NEW</span>}
                    </div>
                    <span style={{ fontSize:10, color:G.muted }}>{CAT_ICON[p.category]} {p.category}</span>
                  </div>
                  <div style={{ fontSize:13, color:G.gold, fontWeight:700, marginLeft:8 }}>{p.price}</div>
                </div>

                {/* Description toggle */}
                {p.description && (
                  <div>
                    <button onClick={() => setExpanded(isOpen ? null : p.id)}
                      style={{ background:'none', border:'none', color:G.muted, fontSize:10, cursor:'pointer', padding:0, marginBottom:6 }}>
                      {isOpen ? '▲ Less' : '▼ Details'}
                    </button>
                    {isOpen && (
                      <div style={{ fontSize:12, color:'#999', lineHeight:1.6, marginBottom:8 }}>{p.description}</div>
                    )}
                  </div>
                )}

                {/* WhatsApp Order Button */}
                <a href={waOrderLink(p.name, WA_NUMBER)} target="_blank" rel="noreferrer"
                  style={{ display:'block', textDecoration:'none', background:G.green, color:'#fff', textAlign:'center', padding:'9px', borderRadius:10, fontSize:12, fontWeight:700 }}>
                  💬 WhatsApp to Order — {p.price}
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ padding:'16px', borderTop:`1px solid ${G.border}`, textAlign:'center' }}>
        <div style={{ fontSize:11, color:G.muted, marginBottom:6 }}>
          📍 Mumbai & Palghar | 🚚 3–5 day delivery
        </div>
        <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer"
          style={{ textDecoration:'none', color:G.gold, fontSize:11 }}>
          WhatsApp for bulk / custom orders
        </a>
        <div style={{ fontSize:9, color:'#333', marginTop:8 }}>uainteriors.in</div>
      </div>
    </div>
  )
}
