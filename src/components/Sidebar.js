import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import rushlyLogo from '../assets/rushly.png';

const NAV_SECTIONS = [
  { label: 'Menu', items: [
    { label: 'Dashboard', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, path: '/dashboard' },
  ]},
  { label: 'Tools', items: [
    { label: 'Scraper', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>, path: '/scraper' },
  ]},
  { label: 'Database', items: [
    { label: 'Schools', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, path: '/schools' },
    { label: 'Leads', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, path: '/leads' },
  ]},
  { label: 'Approval', items: [
    { label: 'Review', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, path: '/review' },
  ]},
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/scraper': 'Scraper',
  '/schools': 'Schools',
  '/leads': 'Leads',
  '/review': 'Review',
};

export const 175px = '175px';

export default function Sidebar({ session }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [collapsed, setCollapsed] = useState({});

  // Update browser tab title
  useEffect(() => {
    const title = PAGE_TITLES[currentPath] || 'Rushly';
    document.title = `${title} | Rushly`;
  }, [currentPath]);

  const toggleSection = (label) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  return (
    <div style={{
      width: '175px', height: '100vh', background: '#405189',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10, overflowY: 'hidden',
      fontFamily: "'DM Sans', Segoe UI, sans-serif"
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        onClick={() => navigate('/dashboard')}>
        <img src={rushlyLogo} alt="Rushly" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
      </div>

      {/* Nav */}
      <div style={{ padding: '8px 10px', flex: 1, overflowY: 'auto' }}>
        {NAV_SECTIONS.map(section => {
          const isCollapsed = collapsed[section.label];
          const hasActive = section.items.some(i => i.path === currentPath);
          return (
            <div key={section.label} style={{ marginBottom: '6px' }}>
              <div
                onClick={() => toggleSection(section.label)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 10px 5px', cursor: 'pointer', borderRadius: '5px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
                  {section.label}
                  {isCollapsed && hasActive && <span style={{ marginLeft: '4px', color: '#00c896' }}>•</span>}
                </span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5"
                  style={{ transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>

              {!isCollapsed && section.items.map(item => {
                const isActive = item.path === currentPath;
                return (
                  <div key={item.path} onClick={() => navigate(item.path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: '6px', cursor: 'pointer',
                      marginBottom: '2px', transition: 'all 0.15s',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                      background: isActive ? 'rgba(0,200,150,0.2)' : 'transparent',
                      borderLeft: isActive ? '3px solid #00c896' : '3px solid transparent',
                      fontSize: '15px', fontWeight: isActive ? '600' : '400',
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}}
                  >
                    <span style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#00c896', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
            {session?.user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.user?.email || ''}</div>
        </div>
        <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '6px 10px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', width: '100%', textAlign: 'left' }}>Sign out</button>
      </div>
    </div>
  );
}
