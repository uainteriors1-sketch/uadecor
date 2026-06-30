import { useState } from 'react'
import { supabase } from '../lib/supabase'

const G = { bg:'#0C0C0C', gold:'#B8860B', border:'#1E1E1E', card:'#141414', text:'#E8E0D0', muted:'#555' }

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [pass, setPass]  = useState('')
  const [err, setErr]    = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setErr('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) { setErr(error.message); setLoading(false); return }
    onLogin(data.user)
  }

  return (
    <div style={{ background:G.bg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:420, padding:'24px 18px' }}>
        <div style={{ textAlign:'center', marginBottom:30 }}>
          <div style={{ fontSize:9, color:G.gold, letterSpacing:3, marginBottom:6 }}>UA INTERIORS</div>
          <div style={{ fontSize:28, fontWeight:800 }}>Admin Login</div>
          <div style={{ fontSize:13, color:G.muted, marginTop:6 }}>Product & Order Management</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:G.muted, marginBottom:6 }}>Email</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@uainteriors.in"
              style={{ width:'100%', background:G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:'12px 14px', color:G.text, fontSize:15, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, color:G.muted, marginBottom:6 }}>Password</div>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"
              style={{ width:'100%', background:G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:'12px 14px', color:G.text, fontSize:15, outline:'none', boxSizing:'border-box' }} />
          </div>

          {err && (
            <div style={{ background:'#1A0000', border:'1px solid #440000', borderRadius:10, padding:'10px 12px', marginBottom:14, fontSize:13, color:'#FF8888' }}>
              {err}
            </div>
          )}

          <button type="submit" disabled={loading || !email || !pass}
            style={{ width:'100%', padding:'13px 14px', borderRadius:12, border:'none', background: email && pass ? G.gold : G.card, color: email && pass ? '#000' : G.muted, fontSize:15, fontWeight:800, cursor: email && pass ? 'pointer' : 'default' }}>
            {loading ? 'Logging in...' : 'Login →'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:20 }}>
          <a href="/" style={{ color:G.muted, fontSize:13, textDecoration:'none' }}>← View Shop</a>
        </div>
      </div>
    </div>
  )
}
