import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div style={{minHeight:'100vh',background:'#0f1117',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Segoe UI,sans-serif'}}>
      <div style={{width:'360px',background:'#161921',border:'1px solid #1e2130',borderRadius:'12px',padding:'32px'}}>
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{width:'44px',height:'44px',background:'#00c896',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',fontSize:'20px',fontWeight:'700',color:'#fff'}}>R</div>
          <div style={{fontSize:'20px',fontWeight:'600',color:'#fff'}}>Rushly</div>
          <div style={{fontSize:'12px',color:'#555',marginTop:'4px'}}>Lead generation for Greek life</div>
        </div>
        {error && <div style={{background:'#2a1a1a',border:'1px solid #ff6b6b',borderRadius:'6px',padding:'10px 12px',fontSize:'12px',color:'#ff6b6b',marginBottom:'16px'}}>{error}</div>}
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:'14px'}}>
            <div style={{fontSize:'11px',color:'#555',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'6px'}}>Email</div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" style={{width:'100%',height:'38px',background:'#0f1117',border:'1px solid #1e2130',borderRadius:'6px',padding:'0 12px',fontSize:'13px',color:'#ccc',outline:'none',boxSizing:'border-box'}} />
          </div>
          <div style={{marginBottom:'20px'}}>
            <div style={{fontSize:'11px',color:'#555',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'6px'}}>Password</div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" style={{width:'100%',height:'38px',background:'#0f1117',border:'1px solid #1e2130',borderRadius:'6px',padding:'0 12px',fontSize:'13px',color:'#ccc',outline:'none',boxSizing:'border-box'}} />
          </div>
          <button type="submit" disabled={loading} style={{width:'100%',height:'40px',background:'#00c896',color:'#fff',border:'none',borderRadius:'6px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}