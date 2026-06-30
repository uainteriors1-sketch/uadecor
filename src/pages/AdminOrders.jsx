import { useState, useEffect } from 'react'
import { supabase, STATUS, statusMessage } from '../lib/supabase'

const G = { bg:'#0C0C0C', gold:'#B8860B', border:'#1E1E1E', card:'#141414', text:'#E8E0D0', muted:'#555', green:'#2E6B4F', red:'#6B2D2D' }

const BLANK_ORDER = {
  client_name:'', client_phone:'', client_address:'',
  product_name:'', quantity:1,
  unit_price:'', gst_percent:12,
  supplier_name:'', expected_delivery:'',
  tracking_number:'', notes:''
}

const genOrderNum = () => `UA${Date.now().toString().slice(-6)}`

export default function AdminOrders() {
  const [orders, setOrders]       = useState([])
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState('list') // list | new | detail
  const [selected, setSelected]   = useState(null)
  const [form, setForm]           = useState(BLANK_ORDER)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')
  const [copied, setCopied]       = useState('')
  const [filterStatus, setFilter] = useState('all')

  const load = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    const [{ data: ord }, { data: prod }] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id,name,price').eq('is_available', true)
    ])
    setOrders(ord || [])
    setProducts(prod || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const notify = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000) }

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key); setTimeout(() => setCopied(''), 2500)
  }

  // ── Calculate pricing ──
  const calcPricing = (unitPrice, qty = 1, gstPct = 12) => {
    const subtotal = parseFloat(unitPrice || 0) * parseInt(qty || 1)
    const gst      = Math.round(subtotal * (gstPct / 100))
    const total    = subtotal + gst
    const advance  = Math.ceil(total * 0.5)
    const balance  = total - advance
    return { subtotal, gst, total, advance, balance }
  }

  // ── Create new order ──
  const createOrder = async () => {
    if (!form.client_name || !form.client_phone || !form.product_name || !form.unit_price) return
    setSaving(true)
    const p = calcPricing(form.unit_price, form.quantity, form.gst_percent)
    const payload = {
      ...form,
      order_number:   genOrderNum(),
      unit_price:     parseFloat(form.unit_price),
      gst_amount:     p.gst,
      total_amount:   p.total,
      advance_amount: p.advance,
      balance_amount: p.balance,
      status:         'received',
    }
    const { data, error } = await supabase.from('orders').insert(payload).select().single()
    if (!error) { notify('✅ Order created!'); await load(); setSelected(data); setView('detail') }
    setSaving(false); setForm(BLANK_ORDER)
  }

  // ── Advance order status ──
  const advanceStatus = async (order) => {
    const statusKeys = Object.keys(STATUS)
    const idx = statusKeys.indexOf(order.status)
    if (idx === -1 || idx === statusKeys.length - 1) return
    const nextStatus = statusKeys[idx + 1]
    const updates = { status: nextStatus }
    if (nextStatus === 'advance_paid')     updates.advance_paid = true, updates.advance_date = new Date().toISOString().split('T')[0]
    if (nextStatus === 'delivered')        updates.delivery_date = new Date().toISOString().split('T')[0]
    if (nextStatus === 'completed')        updates.balance_paid = true, updates.balance_date = new Date().toISOString().split('T')[0]
    await supabase.from('orders').update(updates).eq('id', order.id)
    const updated = { ...order, ...updates }
    setOrders(prev => prev.map(o => o.id === order.id ? updated : o))
    setSelected(updated)
    notify(`✅ Status: ${STATUS[nextStatus].label}`)
  }

  // ── Update field on selected order ──
  const updateField = async (field, value) => {
    await supabase.from('orders').update({ [field]: value }).eq('id', selected.id)
    const updated = { ...selected, [field]: value }
    setSelected(updated)
    setOrders(prev => prev.map(o => o.id === selected.id ? updated : o))
  }

  const filtered = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus)

  // ── Stats ──
  const stats = {
    active:   orders.filter(o => !['delivered','completed'].includes(o.status)).length,
    today:    orders.filter(o => o.created_at?.startsWith(new Date().toISOString().split('T')[0])).length,
    revenue:  orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total_amount || 0), 0),
    pending:  orders.filter(o => !o.balance_paid && ['delivered','completed'].includes(o.status)).reduce((s,o) => s + (o.balance_amount||0), 0),
  }

  // ── Pricing preview in new order form ──
  const preview = form.unit_price ? calcPricing(form.unit_price, form.quantity, form.gst_percent) : null

  return (
    <div style={{ maxWidth:980, margin:'0 auto', padding:'18px 16px 28px', width:'100%' }}>

      {msg && (
        <div style={{ background:'#0D1F15', border:'1px solid #2E6B4F', borderRadius:10, padding:'9px 13px', marginBottom:12, fontSize:12, color:'#7CB87A' }}>{msg}</div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:10, marginBottom:16 }}>
            {[
              { l:'Active Orders', v:stats.active, c:G.gold },
              { l:'Orders Today', v:stats.today, c:'#2C4A7C' },
              { l:'Revenue (Completed)', v:`₹${stats.revenue.toLocaleString('en-IN')}`, c:G.green },
              { l:'Balance Pending', v:`₹${stats.pending.toLocaleString('en-IN')}`, c:'#AA4444' },
            ].map((s,i) => (
              <div key={i} style={{ background:'linear-gradient(135deg, rgba(20,20,20,0.95), rgba(12,12,12,0.95))', borderRadius:14, padding:'14px 12px', border:`1px solid ${s.c}33`, boxShadow:'0 8px 24px rgba(0,0,0,0.22)' }}>
                <div style={{ fontSize:11, color:G.muted, marginBottom:4 }}>{s.l}</div>
                <div style={{ fontSize:20, fontWeight:900, color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* New order button */}
          <button onClick={() => { setForm(BLANK_ORDER); setView('new') }}
            style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1px solid ${G.gold}`, background:`${G.gold}22`, color:G.gold, fontSize:15, fontWeight:800, cursor:'pointer', marginBottom:16 }}>
            ➕ New Order
          </button>

          {/* Status filter */}
          <div style={{ display:'flex', gap:8, overflowX:'auto', marginBottom:16, scrollbarWidth:'none', paddingBottom:4 }}>
            {[['all','All'], ...Object.entries(STATUS).map(([k,v]) => [k, v.label])].map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)}
                style={{ flexShrink:0, padding:'6px 12px', borderRadius:999, border:`1px solid ${filterStatus===k ? G.gold : G.border}`, background: filterStatus===k ? `${G.gold}22` : G.card, color: filterStatus===k ? G.gold : G.muted, fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                {l}
              </button>
            ))}
          </div>

          {loading && <div style={{ color:G.muted, textAlign:'center', padding:30 }}>Loading orders...</div>}
          {!loading && !supabase && <div style={{ color:G.muted, textAlign:'center', padding:30 }}>Supabase is not configured. Connect your environment values to use the admin panel.</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ color:G.muted, textAlign:'center', padding:40, fontSize:13 }}>
              {filterStatus === 'all' ? 'No orders yet. Create your first order!' : `No ${STATUS[filterStatus]?.label} orders`}
            </div>
          )}

          {filtered.map(o => {
            const st = STATUS[o.status] || STATUS.received
            return (
              <div key={o.id} onClick={() => { setSelected(o); setView('detail') }}
                style={{ background:'linear-gradient(135deg, rgba(20,20,20,0.95), rgba(12,12,12,0.95))', borderRadius:16, padding:'14px 15px', marginBottom:10, border:`1px solid ${G.border}`, cursor:'pointer', transition:'border-color 0.2s', boxShadow:'0 8px 24px rgba(0,0,0,0.22)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = G.gold}
                onMouseLeave={e => e.currentTarget.style.borderColor = G.border}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800 }}>{o.client_name}</div>
                    <div style={{ fontSize:12, color:G.muted, marginTop:3, fontWeight:600 }}>{o.order_number} • {o.product_name}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:14, fontWeight:800, color:G.gold }}>₹{(o.total_amount||0).toLocaleString('en-IN')}</div>
                    <div style={{ fontSize:10, color:'#fff', background:st.color, padding:'3px 7px', borderRadius:999, marginTop:4 }}>{st.label}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, fontSize:11, color:G.muted, flexWrap:'wrap', marginTop:6 }}>
                  <span>{o.advance_paid ? '✅ Adv' : '⏳ Adv'}</span>
                  <span>{o.balance_paid ? '✅ Bal' : '⏳ Bal'}</span>
                  {o.tracking_number && <span>📦 {o.tracking_number}</span>}
                  <span style={{ marginLeft:'auto' }}>{o.created_at?.split('T')[0]}</span>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* ── NEW ORDER FORM ── */}
      {view === 'new' && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ fontSize:18, fontWeight:800 }}>➕ New Order</div>
            <button onClick={() => setView('list')} style={{ background:'none', border:'none', color:G.muted, fontSize:13, cursor:'pointer' }}>← Back</button>
          </div>

          {/* Client */}
          <div style={{ fontSize:12, color:G.gold, fontWeight:700, letterSpacing:1.5, marginBottom:10 }}>CLIENT INFO</div>
          {[
            { l:'Client Name *', k:'client_name', ph:'e.g. Rajesh Shah', type:'text' },
            { l:'Phone *', k:'client_phone', ph:'9XXXXXXXXX', type:'tel' },
            { l:'Delivery Address', k:'client_address', ph:'Flat, Building, Area, City', type:'text' },
          ].map(f => (
            <div key={f.k} style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:G.muted, marginBottom:4 }}>{f.l}</div>
              <input type={f.type} value={form[f.k]} onChange={e => setForm({...form,[f.k]:e.target.value})}
                placeholder={f.ph}
                style={{ width:'100%', background:G.card, border:`1px solid ${G.border}`, borderRadius:10, padding:'9px 12px', color:G.text, fontSize:12, outline:'none', boxSizing:'border-box' }} />
            </div>
          ))}

          {/* Product */}
          <div style={{ fontSize:12, color:G.gold, fontWeight:700, letterSpacing:1.5, marginBottom:10, marginTop:18 }}>PRODUCT INFO</div>

          {/* Quick pick from catalogue */}
          {products.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, color:G.muted, marginBottom:6 }}>Quick Pick from Catalogue</div>
              <select onChange={e => {
                const p = products.find(x => x.id === e.target.value)
                if (p) setForm({...form, product_name:p.name})
              }} style={{ width:'100%', background:G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:'12px 14px', color:G.text, fontSize:14, outline:'none', boxSizing:'border-box' }}>
                <option value=''>— Select product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.price})</option>)}
              </select>
            </div>
          )}

          {[
            { l:'Product Name *', k:'product_name', ph:'Custom Forest Mural 150 sq ft', type:'text' },
            { l:'Quantity', k:'quantity', ph:'1', type:'number' },
            { l:'Unit Price (₹) *', k:'unit_price', ph:'e.g. 18000', type:'number' },
          ].map(f => (
            <div key={f.k} style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:G.muted, marginBottom:4 }}>{f.l}</div>
              <input type={f.type} value={form[f.k]} onChange={e => setForm({...form,[f.k]:e.target.value})}
                placeholder={f.ph}
                style={{ width:'100%', background:G.card, border:`1px solid ${G.border}`, borderRadius:10, padding:'9px 12px', color:G.text, fontSize:12, outline:'none', boxSizing:'border-box' }} />
            </div>
          ))}

          {/* Live pricing preview */}
          {preview && (
            <div style={{ background:'#1A1000', borderRadius:12, padding:14, marginBottom:16, border:`1px solid ${G.gold}44` }}>
              <div style={{ fontSize:12, color:G.gold, fontWeight:700, marginBottom:8 }}>PRICING PREVIEW</div>
              {[
                { l:'Subtotal', v:`₹${preview.subtotal.toLocaleString('en-IN')}` },
                { l:`GST (${form.gst_percent}%)`, v:`₹${preview.gst.toLocaleString('en-IN')}` },
                { l:'TOTAL', v:`₹${preview.total.toLocaleString('en-IN')}`, bold:true },
                { l:'50% Advance', v:`₹${preview.advance.toLocaleString('en-IN')}`, c:'#2E6B4F' },
                { l:'50% Balance', v:`₹${preview.balance.toLocaleString('en-IN')}`, c:'#AA4444' },
              ].map((r,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderTop: r.bold ? `1px solid ${G.border}` : 'none', marginTop: r.bold ? 4 : 0 }}>
                  <span style={{ fontSize: r.bold ? 12 : 11, color: r.c || (r.bold ? G.gold : G.muted), fontWeight: r.bold ? 700 : 400 }}>{r.l}</span>
                  <span style={{ fontSize: r.bold ? 13 : 11, color: r.c || (r.bold ? G.gold : G.text), fontWeight: r.bold ? 800 : 400 }}>{r.v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Supplier + notes */}
          <div style={{ fontSize:12, color:G.gold, fontWeight:700, letterSpacing:1.5, marginBottom:10, marginTop:6 }}>SUPPLIER INFO</div>
          {[
            { l:'Supplier Name', k:'supplier_name', ph:'e.g. Magicdecor.in', type:'text' },
            { l:'Expected Delivery Date', k:'expected_delivery', ph:'', type:'date' },
          ].map(f => (
            <div key={f.k} style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, color:G.muted, marginBottom:6 }}>{f.l}</div>
              <input type={f.type} value={form[f.k]} onChange={e => setForm({...form,[f.k]:e.target.value})}
                placeholder={f.ph}
                style={{ width:'100%', background:G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:'12px 14px', color:G.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
            </div>
          ))}

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:G.muted, marginBottom:6 }}>Notes</div>
            <textarea value={form.notes} onChange={e => setForm({...form,notes:e.target.value})}
              placeholder="Client requirements, special instructions..."
              rows={3}
              style={{ width:'100%', background:G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:'12px 14px', color:G.text, fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box' }} />
          </div>

          <button onClick={createOrder} disabled={saving || !form.client_name || !form.client_phone || !form.product_name || !form.unit_price}
            style={{ width:'100%', padding:'13px 14px', borderRadius:12, border:'none', background: (form.client_name && form.client_phone && form.product_name && form.unit_price) ? G.gold : G.card, color: (form.client_name && form.client_phone && form.product_name && form.unit_price) ? '#000' : G.muted, fontSize:15, fontWeight:900, cursor:'pointer' }}>
            {saving ? 'Creating...' : '✅ Create Order'}
          </button>
        </>
      )}

      {/* ── ORDER DETAIL VIEW ── */}
      {view === 'detail' && selected && (() => {
        const st  = STATUS[selected.status] || STATUS.received
        const nextKey = st.next
        const nextSt  = nextKey ? STATUS[nextKey] : null
        const waMsg   = statusMessage(selected, selected.status)

        return (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, gap:12 }}>
              <div>
                <div style={{ fontSize:11, color:G.muted }}>{selected.order_number}</div>
                <div style={{ fontSize:19, fontWeight:800 }}>{selected.client_name}</div>
              </div>
              <button onClick={() => setView('list')} style={{ background:'none', border:'none', color:G.muted, fontSize:13, cursor:'pointer' }}>← Back</button>
            </div>

            {/* Status banner */}
            <div style={{ background:`${st.color}22`, border:`1px solid ${st.color}66`, borderRadius:12, padding:'12px 14px', marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                <div>
                  <div style={{ fontSize:11, color:G.muted, marginBottom:2 }}>CURRENT STATUS</div>
                  <div style={{ fontSize:16, fontWeight:800, color:st.color }}>{st.label}</div>
                </div>
                {nextSt && (
                  <button onClick={() => advanceStatus(selected)}
                    style={{ padding:'10px 14px', borderRadius:10, border:`1px solid ${nextSt.color}`, background:`${nextSt.color}22`, color:nextSt.color, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    → {nextSt.label}
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {(() => {
              const keys = Object.keys(STATUS)
              const idx  = keys.indexOf(selected.status)
              return (
                <div style={{ display:'flex', gap:3, marginBottom:14 }}>
                  {keys.map((k,i) => (
                    <div key={k} style={{ flex:1, height:4, borderRadius:2, background: i <= idx ? STATUS[k].color : G.border }} />
                  ))}
                </div>
              )
            })()}

            {/* WhatsApp message */}
            {waMsg && (
              <div style={{ background:G.card, borderRadius:12, padding:13, marginBottom:12, border:'1px solid #25D36644' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ fontSize:10, color:'#25D366', fontWeight:700 }}>WHATSAPP MESSAGE — ABHI BHEJO</div>
                  <button onClick={() => copy(waMsg, 'wamsg')}
                    style={{ padding:'5px 10px', borderRadius:6, border:'1px solid #25D366', background:'none', color:'#25D366', fontSize:10, cursor:'pointer', fontWeight:700 }}>
                    {copied==='wamsg' ? '✅ Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ fontSize:11, color:'#AAA', lineHeight:1.7, whiteSpace:'pre-line', background:'#0F0F0F', borderRadius:8, padding:10 }}>
                  {waMsg}
                </div>
                <a href={`https://wa.me/${selected.client_phone?.replace(/\D/g,'')}?text=${encodeURIComponent(waMsg)}`}
                   target="_blank" rel="noreferrer"
                   style={{ display:'block', textDecoration:'none', marginTop:8, padding:'8px', borderRadius:8, background:'#25D36622', color:'#25D366', textAlign:'center', fontSize:11, fontWeight:700 }}>
                  Open in WhatsApp →
                </a>
              </div>
            )}

            {/* Payment tracking */}
            <div style={{ background:G.card, borderRadius:12, padding:13, marginBottom:12, border:`1px solid ${G.border}` }}>
              <div style={{ fontSize:10, color:G.gold, fontWeight:700, letterSpacing:1.5, marginBottom:10 }}>PAYMENT TRACKER</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                {[
                  { l:'Total', v:`₹${(selected.total_amount||0).toLocaleString('en-IN')}`, c:G.gold },
                  { l:'50% Advance', v:`₹${(selected.advance_amount||0).toLocaleString('en-IN')}`, c:'#2C4A7C' },
                  { l:'50% Balance', v:`₹${(selected.balance_amount||0).toLocaleString('en-IN')}`, c:'#AA4444' },
                  { l:'GST', v:`₹${(selected.gst_amount||0).toLocaleString('en-IN')}`, c:G.muted },
                ].map((r,i) => (
                  <div key={i} style={{ background:'#0F0F0F', borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ fontSize:9, color:G.muted, marginBottom:2 }}>{r.l}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:r.c }}>{r.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => updateField('advance_paid', !selected.advance_paid)}
                  style={{ flex:1, padding:'8px', borderRadius:8, border:`1px solid ${selected.advance_paid ? G.green : G.border}`, background: selected.advance_paid ? `${G.green}22` : 'none', color: selected.advance_paid ? '#4ECBA6' : G.muted, fontSize:10, fontWeight:700, cursor:'pointer' }}>
                  {selected.advance_paid ? '✅ Advance Paid' : '⏳ Mark Advance Paid'}
                </button>
                <button onClick={() => updateField('balance_paid', !selected.balance_paid)}
                  style={{ flex:1, padding:'8px', borderRadius:8, border:`1px solid ${selected.balance_paid ? G.green : G.border}`, background: selected.balance_paid ? `${G.green}22` : 'none', color: selected.balance_paid ? '#4ECBA6' : G.muted, fontSize:10, fontWeight:700, cursor:'pointer' }}>
                  {selected.balance_paid ? '✅ Balance Paid' : '⏳ Mark Balance Paid'}
                </button>
              </div>
            </div>

            {/* Tracking number input */}
            <div style={{ background:G.card, borderRadius:12, padding:13, marginBottom:12, border:`1px solid ${G.border}` }}>
              <div style={{ fontSize:10, color:G.gold, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>TRACKING & DELIVERY</div>
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, color:G.muted, marginBottom:4 }}>Tracking Number</div>
                <div style={{ display:'flex', gap:6 }}>
                  <input
                    defaultValue={selected.tracking_number || ''}
                    onBlur={e => updateField('tracking_number', e.target.value)}
                    placeholder="Enter tracking number"
                    style={{ flex:1, background:'#0F0F0F', border:`1px solid ${G.border}`, borderRadius:8, padding:'8px 10px', color:G.text, fontSize:12, outline:'none' }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize:10, color:G.muted, marginBottom:4 }}>Expected Delivery Date</div>
                <input type="date"
                  defaultValue={selected.expected_delivery || ''}
                  onBlur={e => updateField('expected_delivery', e.target.value)}
                  style={{ width:'100%', background:'#0F0F0F', border:`1px solid ${G.border}`, borderRadius:8, padding:'8px 10px', color:G.text, fontSize:12, outline:'none', boxSizing:'border-box' }} />
              </div>
            </div>

            {/* Order summary */}
            <div style={{ background:G.card, borderRadius:12, padding:13, marginBottom:12, border:`1px solid ${G.border}` }}>
              <div style={{ fontSize:10, color:G.gold, fontWeight:700, letterSpacing:1.5, marginBottom:10 }}>ORDER SUMMARY</div>
              {[
                { l:'Product', v:selected.product_name },
                { l:'Qty', v:selected.quantity },
                { l:'Supplier', v:selected.supplier_name || '—' },
                { l:'Client Phone', v:selected.client_phone },
                { l:'Delivery Address', v:selected.client_address || '—' },
                { l:'Notes', v:selected.notes || '—' },
              ].map((r,i) => (
                <div key={i} style={{ display:'flex', gap:10, padding:'6px 0', borderBottom: i<5 ? `1px solid ${G.border}` : 'none' }}>
                  <span style={{ fontSize:10, color:G.muted, width:90, flexShrink:0 }}>{r.l}</span>
                  <span style={{ fontSize:11, color:G.text, wordBreak:'break-word' }}>{r.v}</span>
                </div>
              ))}
            </div>

            {/* GST Invoice reminder */}
            {(selected.status === 'delivered' || selected.status === 'completed') && (
              <div style={{ background:'#0D1F15', borderRadius:12, padding:13, marginBottom:12, border:'1px solid #2E6B4F' }}>
                <div style={{ fontSize:10, color:'#4ECBA6', fontWeight:700, marginBottom:6 }}>📄 GST INVOICE — GENERATE KARO</div>
                <div style={{ fontSize:11, color:'#7CB87A', lineHeight:1.7 }}>
                  Vyapar App kholein → New Invoice → Client details fill karein → Share WhatsApp pe.
                </div>
                <div style={{ marginTop:8, fontSize:11, color:'#555' }}>
                  Invoice details: {selected.client_name} | ₹{(selected.total_amount||0).toLocaleString('en-IN')} | GST ₹{(selected.gst_amount||0).toLocaleString('en-IN')}
                </div>
                <button onClick={() => copy(`${selected.client_name}\n${selected.client_address}\nProduct: ${selected.product_name}\nQty: ${selected.quantity}\nTotal: ₹${selected.total_amount}\nGST: ₹${selected.gst_amount}`, 'inv')}
                  style={{ marginTop:8, padding:'6px 12px', borderRadius:8, border:'1px solid #2E6B4F', background:'none', color:'#4ECBA6', fontSize:10, cursor:'pointer' }}>
                  {copied==='inv' ? '✅ Copied!' : 'Copy Invoice Details'}
                </button>
              </div>
            )}
          </>
        )
      })()}
    </div>
  )
}
