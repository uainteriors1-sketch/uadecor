import { useState, useEffect } from 'react'
import { supabase, isNew, waOrderLink } from '../lib/supabase'

const G = { bg:'#0C0C0C', gold:'#B8860B', border:'#1E1E1E', card:'#141414', text:'#E8E0D0', muted:'#555', green:'#2E6B4F' }
const CATS = ['All','Murals','Mirrors','Vases','Art','Plants','Fragrance','Frames','Soft Furnish','Lighting','Hardware']
const CAT_ICON = { Murals:'🖼️', Mirrors:'🪞', Vases:'🏺', Art:'🎨', Plants:'🌿', Fragrance:'🕯️', Frames:'🖼️', 'Soft Furnish':'🛏️', Lighting:'💡', Hardware:'🔩' }
const WA_NUMBER = '919930673587' // REPLACE with actual number

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
    <div style={{ background:G.bg, minHeight:'100vh', width:'100%', maxWidth:980, margin:'0 auto', padding:'0 0 24px' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, rgba(184,134,11,0.18), rgba(12,12,12,0.98))', padding:'22px 18px 16px', borderBottom:`1px solid ${G.border}`, position:'sticky', top:0, zIndex:50, boxShadow:'0 10px 32px rgba(0,0,0,0.28)', backdropFilter:'blur(16px)', margin:'0 12px 16px', borderRadius:'0 0 24px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, gap:12 }}>
          <div>
            <div className="hero-chip" style={{ marginBottom:8 }}>Curated Luxury Decor</div>
            <div style={{ fontSize:28, fontWeight:800, letterSpacing:-0.5 }}>UA Interiors</div>
            <div style={{ fontSize:13, color:G.muted, marginTop:4 }}>Mumbai & Palghar Delivery 🚚 • Premium home styling</div>
          </div>
          <div style={{ textAlign:'right', minWidth:120 }}>
            <a href={`https://wa.me/${WA_NUMBER}?text=Hi UA Interiors, I want to see your catalogue`}
               target="_blank" rel="noreferrer"
               className="premium-button"
               style={{ display:'block', textDecoration:'none', background:'linear-gradient(135deg, #2E6B4F, #1F4A36)', color:'#fff', padding:'10px 14px', borderRadius:12, fontSize:13, fontWeight:700 }}>
              💬 WhatsApp
            </a>
            {newCount > 0 && (
              <div className="hero-chip" style={{ marginTop:8, padding:'5px 9px', fontSize:10 }}>🆕 {newCount} New Arrivals</div>
            )}
          </div>
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search products..."
          style={{ width:'100%', background:'rgba(20,20,20,0.9)', border:`1px solid ${G.border}`, borderRadius:14, padding:'12px 14px', color:G.text, fontSize:14, outline:'none', marginBottom:12, boxSizing:'border-box' }} />

        {/* Category filter */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:10, scrollbarWidth:'none' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="premium-button"
              style={{ flexShrink:0, padding:'7px 13px', borderRadius:999, border:`1px solid ${cat === c ? G.gold : G.border}`, background: cat === c ? `${G.gold}22` : 'rgba(20,20,20,0.9)', color: cat === c ? G.gold : G.muted, fontSize:12, fontWeight: cat === c ? 700 : 400, cursor:'pointer', whiteSpace:'nowrap' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div style={{ padding:'8px 16px 0' }}>
        {loading && (
          <div style={{ textAlign:'center', padding:40, color:G.muted, fontSize:13 }}>Loading products...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:40, color:G.muted, fontSize:13 }}>No products in this category</div>
        )}

        {!loading && filtered.map((p, index) => {
          const _new = isNew(p.created_at)
          const isOpen = expanded === p.id
          return (
            <div key={p.id} className="premium-card" style={{ marginBottom:12, border:`1px solid ${isOpen ? G.gold : G.border}`, borderRadius:18, overflow:'hidden', background:'linear-gradient(180deg, rgba(20,20,20,0.95), rgba(12,12,12,0.96))', boxShadow:'0 10px 30px rgba(0,0,0,0.24)', animationDelay:`${index * 70}ms` }}>
              {/* Product image or icon */}
              {p.image_url && (
                <img src={p.image_url} alt={p.name}
                  style={{ width:'100%', height:220, objectFit:'cover', display:'block' }} />
              )}
              {!p.image_url && (
                <div style={{ background:`${G.gold}11`, height:110, display:'flex', alignItems:'center', justifyContent:'center', fontSize:42 }}>
                  {CAT_ICON[p.category] || '📦'}
                </div>
              )}

              <div style={{ padding:'14px 15px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', marginBottom:3 }}>
                      <span style={{ fontSize:16, fontWeight:700 }}>{p.name}</span>
                      {_new && <span style={{ fontSize:8, background:'#FF4400', color:'#fff', padding:'1px 5px', borderRadius:8, fontWeight:800, flexShrink:0 }}>🆕 NEW</span>}
                    </div>
                    <span style={{ fontSize:12, color:G.muted }}>{CAT_ICON[p.category]} {p.category}</span>
                  </div>
                  <div style={{ fontSize:15, color:G.gold, fontWeight:700, marginLeft:8 }}>{p.price}</div>
                </div>

                {/* Description toggle */}
                {p.description && (
                  <div>
                    <button onClick={() => setExpanded(isOpen ? null : p.id)}
                      style={{ background:'none', border:'none', color:G.muted, fontSize:12, cursor:'pointer', padding:0, marginBottom:8 }}>
                      {isOpen ? '▲ Less' : '▼ Details'}
                    </button>
                    {isOpen && (
                      <div style={{ fontSize:14, color:'#999', lineHeight:1.7, marginBottom:10 }}>{p.description}</div>
                    )}
                  </div>
                )}

                {/* WhatsApp Order Button */}
                <a href={waOrderLink(p.name, WA_NUMBER)} target="_blank" rel="noreferrer"
                  className="premium-button"
                  style={{ display:'block', textDecoration:'none', background:'linear-gradient(135deg, #2E6B4F, #1F4A36)', color:'#fff', textAlign:'center', padding:'11px', borderRadius:12, fontSize:14, fontWeight:700 }}>
                  💬 WhatsApp to Order — {p.price}
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ padding:'16px', borderTop:`1px solid ${G.border}`, textAlign:'center' }}>
        <div style={{ fontSize:13, color:G.muted, marginBottom:8 }}>
          📍 Mumbai & Palghar | 🚚 3–5 day delivery
        </div>
        <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer"
          style={{ textDecoration:'none', color:G.gold, fontSize:13 }}>
          WhatsApp for bulk / custom orders
        </a>
        <div style={{ fontSize:11, color:'#333', marginTop:10 }}>uainteriors.in</div>
      </div>
    </div>
  )
}
