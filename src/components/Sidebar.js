import React, { useState, useEffect, useRef } from 'react';
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

const DARK = {
  bg: '#0f1117',
  card: '#1a1d2e',
  border: '#2d3148',
  text: '#e2e8f0',
  textSub: '#6b7280',
  tableHeader: '#1e2235',
  input: '#1a1d2e',
};

export { DARK };

export default function Sidebar({ session }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [collapsed, setCollapsed] = useState({});
  const [dark, setDark] = useState(() => localStorage.getItem('rushly-dark') === 'true');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const title = PAGE_TITLES[currentPath] || 'Rushly';
    document.title = `${title} | Rushly`;
  }, [currentPath]);

  useEffect(() => {
    document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('rushly-dark', dark);
  }, [dark]);

  useEffect(() => {
    if (localStorage.getItem('rushly-dark') === 'true') {
      document.body.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handle = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const toggleSection = (label) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const W = sidebarOpen ? '175px' : '52px';

  return (
    <>
      <style>{`
        /* Page backgrounds */
        [data-theme="dark"] div[style*="background: rgb(245, 246, 250)"],
        [data-theme="dark"] div[style*="background: #f5f6fa"] {
          background: #0f1117 !important;
        }
        
        /* White cards */
        [data-theme="dark"] div[style*="background: rgb(255, 255, 255)"],
        [data-theme="dark"] div[style*="background: #fff"] {
          background: #1a1d2e !important;
        }

        /* Stat cards - preserve colored top border */
        [data-theme="dark"] div[style*="border-top: 3px solid #00c896"] { background: #1a1d2e !important; border-color: #2d3148 !important; border-top-color: #00c896 !important; }
        [data-theme="dark"] div[style*="border-top: 3px solid #3b82f6"] { background: #1a1d2e !important; border-color: #2d3148 !important; border-top-color: #3b82f6 !important; }
        [data-theme="dark"] div[style*="border-top: 3px solid #f59e0b"] { background: #1a1d2e !important; border-color: #2d3148 !important; border-top-color: #f59e0b !important; }
        [data-theme="dark"] div[style*="border-top: 3px solid #e05c5c"] { background: #1a1d2e !important; border-color: #2d3148 !important; border-top-color: #e05c5c !important; }
        
        /* Table headers */
        [data-theme="dark"] tr[style*="background: rgb(245, 246, 250)"],
        [data-theme="dark"] tr[style*="background: #f5f6fa"] {
          background: #1e2235 !important;
        }
        
        /* Pagination */
        [data-theme="dark"] div[style*="background: rgb(249, 250, 251)"],
        [data-theme="dark"] div[style*="background: #f9fafb"] {
          background: #1e2235 !important;
        }
        
        /* Text colors */
        [data-theme="dark"] *[style*="color: rgb(26, 29, 46)"],
        [data-theme="dark"] *[style*="color: #1a1d2e"] { color: #e2e8f0 !important; }
        
        [data-theme="dark"] *[style*="color: rgb(144, 148, 168)"],
        [data-theme="dark"] *[style*="color: #9094a8"] { color: #8892a4 !important; }

        /* Table row borders - subtle */
        [data-theme="dark"] tr[style*="border-bottom: 1px solid rgb(240, 241, 245)"],
        [data-theme="dark"] tr[style*="border-bottom: 1px solid #f0f1f5"] {
          border-bottom-color: #232640 !important;
        }

        /* Card borders */
        [data-theme="dark"] div[style*="border: 1px solid rgb(232, 234, 240)"],
        [data-theme="dark"] div[style*="border: 1px solid #e8eaf0"] {
          border-color: #2d3148 !important;
        }

        [data-theme="dark"] div[style*="border: 0.5px solid #e8eaf0"],
        [data-theme="dark"] div[style*="border: 0.5px solid rgb(232, 234, 240)"] {
          border-color: #2d3148 !important;
        }

        /* Buttons in tables */
        [data-theme="dark"] button[style*="background: rgb(255, 255, 255)"],
        [data-theme="dark"] button[style*="background: #fff"] {
          background: #2a2f52 !important;
          border-color: #3d4470 !important;
          color: #e2e8f0 !important;
        }

        /* Inputs and selects */
        [data-theme="dark"] input { background: #1a1d2e !important; border-color: #2d3148 !important; color: #e2e8f0 !important; }
        [data-theme="dark"] select { background: #1a1d2e !important; border-color: #2d3148 !important; color: #e2e8f0 !important; }

        /* Table row hover - dark mode fix */
        [data-theme="dark"] tr:hover,
        [data-theme="dark"] tr[style*="background: rgb(249, 250, 251)"],
        [data-theme="dark"] tr[style*="background: #f9fafb"] {
          background: #1e2235 !important;
        }
        [data-theme="dark"] tr:hover td { color: #e2e8f0 !important; }

        /* Expanded row background */
        [data-theme="dark"] td[style*="background: rgb(249, 250, 251)"],
        [data-theme="dark"] td[style*="background: #f9fafb"] { background: #1e2235 !important; }
      `}</style>

      <div style={{
        width: W, height: '100vh', background: '#405189',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10,
        overflowY: 'hidden', overflowX: 'hidden',
        transition: 'width 0.25s ease',
        fontFamily: "'DM Sans', Segoe UI, sans-serif"
      }}>

        {/* Logo + Hamburger */}
        <div style={{ padding: '16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '64px' }}>
          {sidebarOpen && (
            <div style={{ cursor: 'pointer', flex: 1, display: 'flex', justifyContent: 'center' }} onClick={() => navigate('/dashboard')}>
              <img src={rushlyLogo} alt="Rushly" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'rgba(255,255,255,0.6)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Nav */}
        <div style={{ padding: '8px 8px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {NAV_SECTIONS.map(section => {
            const isCollapsed = collapsed[section.label];
            const hasActive = section.items.some(i => i.path === currentPath);
            return (
              <div key={section.label} style={{ marginBottom: '6px' }}>
                {sidebarOpen && (
                  <div onClick={() => toggleSection(section.label)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 8px 4px', cursor: 'pointer', borderRadius: '5px' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
                      {section.label}
                      {isCollapsed && hasActive && <span style={{ marginLeft: '4px', color: '#00c896' }}>•</span>}
                    </span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"
                      style={{ transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                )}

                {(!isCollapsed || !sidebarOpen) && section.items.map(item => {
                  const isActive = item.path === currentPath;
                  return (
                    <div key={item.path} onClick={() => navigate(item.path)}
                      title={!sidebarOpen ? item.label : ''}
                      style={{
                        display: 'flex', alignItems: 'center', gap: sidebarOpen ? '10px' : '0',
                        justifyContent: sidebarOpen ? 'flex-start' : 'center',
                        padding: sidebarOpen ? '9px 10px' : '10px 0',
                        borderRadius: '6px', cursor: 'pointer',
                        marginBottom: '2px', transition: 'all 0.15s',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                        background: isActive ? 'rgba(0,200,150,0.2)' : 'transparent',
                        borderLeft: isActive ? '3px solid #00c896' : '3px solid transparent',
                        fontSize: '14px', fontWeight: isActive ? '600' : '400',
                      }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}}
                    >
                      <span style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
                      {sidebarOpen && item.label}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User footer */}
        <div style={{ padding: '10px 10px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.12)', position: 'relative' }} ref={profileRef}>
          <div
            onClick={() => setProfileOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px', borderRadius: '6px', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#00c896', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
              {session?.user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{session?.user?.email || ''}</div>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </>
            )}
          </div>

          {/* Profile dropdown */}
          {profileOpen && (
            <div style={{
              position: 'absolute', bottom: '54px', left: '10px', right: '10px',
              background: '#fff', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              overflow: 'hidden', zIndex: 100
            }}>
              {/* User info header */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f1f5', background: '#f9fafb' }}>
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#1a1d2e' }}>{session?.user?.email?.split('@')[0] || 'User'}</div>
                <div style={{ fontSize: '11px', color: '#9094a8', marginTop: '2px' }}>Admin</div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', fontSize: '13px', color: '#1a1d2e', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f6fa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Profile
                </div>

                {/* Dark mode toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', fontSize: '13px', color: '#1a1d2e', cursor: 'pointer' }}
                  onClick={() => setDark(d => !d)}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f6fa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {dark
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    }
                    {dark ? 'Light mode' : 'Dark mode'}
                  </div>
                  <div style={{ width: '28px', height: '16px', background: dark ? '#00c896' : '#e8eaf0', borderRadius: '8px', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ width: '12px', height: '12px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: dark ? '14px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>

                <div style={{ height: '1px', background: '#f0f1f5', margin: '2px 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', fontSize: '13px', color: '#e05c5c', cursor: 'pointer' }}
                  onClick={handleLogout}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Logout
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
