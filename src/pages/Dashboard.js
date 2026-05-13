import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  ), path: '/dashboard' },
  { label: 'Scraper', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
  ), path: '/scraper' },
  { label: 'Leads', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ), path: '/leads' },
  { label: 'Review', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  ), path: '/review' },
];

export default function Dashboard({ session }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', Segoe UI, sans-serif", background: '#f5f6fa' }}>

      {/* Sidebar */}
      <div style={{
        width: '200px', minHeight: '100vh', background: '#2d3561',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', background: '#00c896',
              borderRadius: '8px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#fff'
            }}>R</div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '-0.2px' }}>Rushly</span>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '12px 8px', flex: 1 }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '8px 8px 6px' }}>Menu</div>
          {NAV_ITEMS.map(item => (
            <div key={item.path} onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 10px', borderRadius: '7px', cursor: 'pointer',
                color: item.path === '/dashboard' ? '#fff' : 'rgba(255,255,255,0.65)',
                background: item.path === '/dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent',
                fontSize: '13px', fontWeight: '500',
                marginBottom: '2px', transition: 'background 0.15s, color 0.15s'
              }}
              onMouseEnter={e => { if (item.path !== '/dashboard') { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}}
              onMouseLeave={e => { if (item.path !== '/dashboard') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </div>

        {/* User */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user.email}</div>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px',
            padding: '6px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', width: '100%', textAlign: 'left'
          }}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: '200px', flex: 1, padding: '32px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1d2e', letterSpacing: '-0.3px' }}>Dashboard</div>
            <div style={{ fontSize: '13px', color: '#9094a8', marginTop: '2px' }}>Select a tool to get started</div>
          </div>
        </div>

        {/* Tool cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', maxWidth: '700px' }}>

          {/* CampusLabs Scraper */}
          <div onClick={() => navigate('/scraper')}
            style={{
              background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px',
              padding: '24px', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,200,150,0.12)'; e.currentTarget.style.borderColor = '#00c896'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e8eaf0'; }}
          >
            <div style={{
              width: '40px', height: '40px', background: '#e8faf5',
              borderRadius: '10px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '14px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c896" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1d2e', marginBottom: '6px' }}>CampusLabs Scraper</div>
            <div style={{ fontSize: '12px', color: '#9094a8', lineHeight: '1.6' }}>Scrape org contact info from any CampusLabs school directory</div>
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#00c896', fontWeight: '600' }}>Open tool →</div>
          </div>

          {/* Leads Viewer */}
          <div onClick={() => navigate('/leads')}
            style={{
              background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px',
              padding: '24px', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,200,150,0.12)'; e.currentTarget.style.borderColor = '#00c896'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e8eaf0'; }}
          >
            <div style={{
              width: '40px', height: '40px', background: '#e8faf5',
              borderRadius: '10px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '14px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c896" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1d2e', marginBottom: '6px' }}>Leads Viewer</div>
            <div style={{ fontSize: '12px', color: '#9094a8', lineHeight: '1.6' }}>Browse, filter, and export all scraped leads from Supabase</div>
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#00c896', fontWeight: '600' }}>View leads →</div>
          </div>

          {/* Review */}
          <div onClick={() => navigate('/review')}
            style={{
              background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px',
              padding: '24px', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,200,150,0.12)'; e.currentTarget.style.borderColor = '#00c896'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e8eaf0'; }}
          >
            <div style={{ width: '40px', height: '40px', background: '#e8faf5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c896" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1d2e', marginBottom: '6px' }}>Review</div>
            <div style={{ fontSize: '12px', color: '#9094a8', lineHeight: '1.6' }}>Review unmatched orgs and add them to the masterlist</div>
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#00c896', fontWeight: '600' }}>Open review →</div>
          </div>

          {/* Instagram Scanner - coming soon */}
          <div style={{
            background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px',
            padding: '24px', opacity: 0.5
          }}>
            <div style={{
              width: '40px', height: '40px', background: '#f5f6fa',
              borderRadius: '10px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '14px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9094a8" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1d2e', marginBottom: '6px' }}>Instagram Scanner</div>
            <div style={{ fontSize: '12px', color: '#9094a8', lineHeight: '1.6' }}>Scan Instagram accounts for contact info in recent posts</div>
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#9094a8', fontWeight: '500' }}>Coming soon</div>
          </div>

        </div>
      </div>
    </div>
  );
}
