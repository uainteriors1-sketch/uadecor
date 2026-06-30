import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import Shop from './pages/Shop'
import Login from './pages/Login'
import AdminProducts from './pages/AdminProducts'
import AdminOrders from './pages/AdminOrders'

const G = { bg:'#0C0C0C', gold:'#B8860B', border:'#1E1E1E', card:'#141414', text:'#E8E0D0', muted:'#555' }

function AdminNav({ onLogout }) {
  const loc = useLocation()
  return (
    <div style={{ background:'#0C0C0C', borderBottom:`1px solid ${G.border}`, position:'sticky', top:0, zIndex:100 }}>
      <div style={{ maxWidth:480, margin:'0 auto', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:9, color:G.gold, letterSpacing:2 }}>UA INTERIORS</div>
          <div style={{ fontSize:13, fontWeight:700 }}>Admin Panel</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <Link to="/admin/products" style={{ textDecoration:'none', padding:'5px 10px', borderRadius:8, background: loc.pathname.includes('products') ? `${G.gold}22` : 'none', border:`1px solid ${loc.pathname.includes('products') ? G.gold : G.border}`, color: loc.pathname.includes('products') ? G.gold : G.muted, fontSize:10, fontWeight:700 }}>
            📦 Products
          </Link>
          <Link to="/admin/orders" style={{ textDecoration:'none', padding:'5px 10px', borderRadius:8, background: loc.pathname.includes('orders') ? `${G.gold}22` : 'none', border:`1px solid ${loc.pathname.includes('orders') ? G.gold : G.border}`, color: loc.pathname.includes('orders') ? G.gold : G.muted, fontSize:10, fontWeight:700 }}>
            📋 Orders
          </Link>
          <button onClick={onLogout} style={{ padding:'5px 8px', borderRadius:8, border:`1px solid ${G.border}`, background:'none', color:G.muted, fontSize:10, cursor:'pointer' }}>
            Exit
          </button>
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) return (
    <div style={{ background:G.bg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:G.gold, fontSize:13 }}>Loading UA Interiors...</div>
    </div>
  )

  if (!isSupabaseConfigured) return (
    <div style={{ background:G.bg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ maxWidth:420, background:G.card, border:`1px solid ${G.border}`, borderRadius:16, padding:24, textAlign:'center' }}>
        <div style={{ color:G.gold, fontSize:14, fontWeight:700, marginBottom:8 }}>Supabase setup required</div>
        <div style={{ color:G.text, fontSize:14, lineHeight:1.6 }}>
          Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values in the environment for this app, then refresh.
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ background:G.bg, minHeight:'100vh', width:'100%' }}>
      <Routes>
        {/* PUBLIC SHOP */}
        <Route path="/" element={<Shop />} />
        <Route path="/shop" element={<Shop />} />

        {/* ADMIN */}
        <Route path="/admin/login" element={
          user ? <Navigate to="/admin/products" replace /> : <Login onLogin={setUser} />
        } />
        <Route path="/admin/products" element={
          <ProtectedRoute user={user}>
            <AdminNav onLogout={handleLogout} />
            <AdminProducts />
          </ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute user={user}>
            <AdminNav onLogout={handleLogout} />
            <AdminOrders />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
