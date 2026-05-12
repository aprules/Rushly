import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Dashboard({ session }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{minHeight:'100vh',background:'#0f1117',fontFamily:'Segoe UI,sans-serif'}}>
      <div style={{background:'#161921',borderBottom:'1px solid #1e2130',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'32px',height:'32px',background:'#00c896',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',fontWeight:'700',color:'#fff'}}>R</div>
          <div style={{fontSize:'14px',fontWeight:'600',color:'#fff'}}>Rushly</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <div style={{fontSize:'12px',color:'#555'}}>{session.user.email}</div>
          <button onClick={handleLogout} style={{background:'none',border:'1px solid #1e2130',borderRadius:'6px',padding:'6px 12px',fontSize:'12px',color:'#555',cursor:'pointer'}}>Sign out</button>
        </div>
      </div>
      <div style={{padding:'32px 24px'}}>
        <div style={{marginBottom:'24px'}}>
          <div style={{fontSize:'20px',fontWeight:'600',color:'#fff',marginBottom:'4px'}}>Dashboard</div>
          <div style={{fontSize:'12px',color:'#555'}}>Select a tool to get started</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'16px'}}>
          <div onClick={() => navigate('/scraper')} style={{background:'#161921',border:'1px solid #1e2130',borderRadius:'12px',padding:'24px',cursor:'pointer',transition:'border-color 0.15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#00c896'} onMouseLeave={e=>e.currentTarget.style.borderColor='#1e2130'}>
            <div style={{width:'40px',height:'40px',background:'#0a2a1f',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'14px'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c896" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#fff',marginBottom:'6px'}}>CampusLabs Scraper</div>
            <div style={{fontSize:'12px',color:'#555',lineHeight:'1.5'}}>Scrape org contact info from any CampusLabs school directory</div>
            <div style={{marginTop:'14px',fontSize:'11px',color:'#00c896',fontWeight:'500'}}>Open tool →</div>
          </div>
          <div style={{background:'#161921',border:'1px solid #1e2130',borderRadius:'12px',padding:'24px',opacity:'0.5'}}>
            <div style={{width:'40px',height:'40px',background:'#1a1d26',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'14px'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </div>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#fff',marginBottom:'6px'}}>Instagram Scanner</div>
            <div style={{fontSize:'12px',color:'#555',lineHeight:'1.5'}}>Scan Instagram accounts for contact info in recent posts</div>
            <div style={{marginTop:'14px',fontSize:'11px',color:'#555',fontWeight:'500'}}>Coming soon</div>
          </div>
        </div>
      </div>
    </div>
  );
}