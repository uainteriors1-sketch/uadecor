import { useState, useEffect } from 'react'
import { supabase, isNew, waOrderLink, parseImageUrls } from '../lib/supabase'

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
  const [activeGallery, setActiveGallery] = useState({})

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

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
            <div style={{ fontSize:28, fontWeight:900, letterSpacing:-0.5 }}>UA Interiors</div>
            <div style={{ fontSize:13, color:G.muted, marginTop:4, fontWeight:600 }}>Mumbai & Palghar Delivery 🚚 • Premium home styling</div>
          </div>
          <div style={{ textAlign:'right', minWidth:120 }}>
            <a href={`https://wa.me/${WA_NUMBER}?text=Hi UA Interiors, I want to see your catalogue`}
               target="_blank" rel="noreferrer"
               className="premium-button"
               style={{ display:'block', textDecoration:'none', background:'linear-gradient(135deg, #2E6B4F, #1F4A36)', color:'#fff', padding:'10px 14px', borderRadius:12, fontSize:13, fontWeight:800 }}>
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
        <div style={{ margin:'0 0 12px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div style={{ fontSize:12, color:G.muted, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase' }}>Premium product gallery</div>
          <div style={{ fontSize:12, color:G.muted }}>Clear images • price-first • ready to order</div>
        </div>
        {loading && (
          <div style={{ textAlign:'center', padding:40, color:G.muted, fontSize:13 }}>Loading products...</div>
        )}

        {!loading && !supabase && (
          <div style={{ textAlign:'center', padding:40, color:G.muted, fontSize:13 }}>Supabase is not configured yet. Add your environment values to load the catalog.</div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:40, color:G.muted, fontSize:13 }}>No products in this category</div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:14 }}>
          {!loading && filtered.map((p, index) => {
            const _new = isNew(p.created_at)
            const isOpen = expanded === p.id
            const galleryImages = parseImageUrls(p.image_url)
            const activeImageIndex = activeGallery[p.id] || 0
            const activeImage = galleryImages[activeImageIndex] || galleryImages[0] || ''
            const shortDesc = p.description ? `${p.description.replace(/\s+/g, ' ').slice(0, 92)}${p.description.length > 92 ? '…' : ''}` : 'Premium piece curated for modern interiors.'
            return (
              <div key={p.id} className="premium-card" style={{ border:`1px solid ${isOpen ? G.gold : G.border}`, borderRadius:18, overflow:'hidden', background:'linear-gradient(180deg, rgba(20,20,20,0.95), rgba(12,12,12,0.96))', boxShadow:'0 10px 30px rgba(0,0,0,0.24)', animationDelay:`${index * 70}ms`, display:'flex', flexDirection:'column' }}>
                <div style={{ position:'relative' }}>
                  {activeImage ? (
                    <img src={activeImage} alt={p.name}
                      style={{ width:'100%', height:220, objectFit:'cover', display:'block' }} />
                  ) : (
                    <div style={{ background:`${G.gold}11`, height:220, display:'flex', alignItems:'center', justifyContent:'center', fontSize:42 }}>
                      {CAT_ICON[p.category] || '📦'}
                    </div>
                  )}
                  <div style={{ position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.7)', color:G.text, padding:'5px 8px', borderRadius:999, fontSize:11, fontWeight:700 }}>{p.category}</div>
                  {_new && (
                    <div style={{ position:'absolute', top:10, right:10, background:'#FF4400', color:'#fff', padding:'5px 8px', borderRadius:999, fontSize:10, fontWeight:800 }}>NEW</div>
                  )}
                </div>

                {galleryImages.length > 1 && (
                  <div style={{ display:'flex', gap:8, padding:'10px 12px 0', overflowX:'auto' }}>
                    {galleryImages.map((src, idx) => (
                      <button key={`${p.id}-${idx}`} onClick={() => setActiveGallery(prev => ({ ...prev, [p.id]: idx }))}
                        style={{ border: idx === activeImageIndex ? `2px solid ${G.gold}` : `1px solid ${G.border}`, borderRadius:10, overflow:'hidden', padding:0, background:'none', cursor:'pointer', flexShrink:0 }}>
                        <img src={src} alt={`${p.name} ${idx + 1}`} style={{ width:52, height:52, objectFit:'cover', display:'block' }} />
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ padding:'12px 12px 14px', display:'flex', flexDirection:'column', flex:1 }}>
                  <div style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>{p.name}</div>
                  <div style={{ fontSize:12, color:G.muted, marginBottom:10, lineHeight:1.5, minHeight:42 }}>{shortDesc}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto', marginBottom:10 }}>
                    <div style={{ fontSize:18, color:G.gold, fontWeight:800 }}>{p.price}</div>
                    <button onClick={() => setExpanded(isOpen ? null : p.id)}
                      style={{ background:'none', border:`1px solid ${G.border}`, color:G.muted, borderRadius:999, padding:'6px 10px', fontSize:11, cursor:'pointer' }}>
                      {isOpen ? 'Hide' : 'Details'}
                    </button>
                  </div>

                  {isOpen && p.description && (
                    <div style={{ fontSize:13, color:'#999', lineHeight:1.7, marginBottom:10 }}>{p.description}</div>
                  )}

                  <a href={waOrderLink(p.name, WA_NUMBER)} target="_blank" rel="noreferrer"
                    className="premium-button"
                    style={{ display:'block', textDecoration:'none', background:'linear-gradient(135deg, #2E6B4F, #1F4A36)', color:'#fff', textAlign:'center', padding:'10px 12px', borderRadius:12, fontSize:13, fontWeight:800 }}>
                    💬 WhatsApp to Order
                  </a>
                </div>
              </div>
            )
          })}
        </div>
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
