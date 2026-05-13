import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar, { 175px } from '../components/Sidebar';

const NAV_SECTIONS = [
  {
    label: 'Menu',
    items: [
      { label: 'Dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, path: '/dashboard' },
    ]
  },
  {
    label: 'Tools',
    items: [
      { label: 'Scraper', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>, path: '/scraper' },
    ]
  },
  {
    label: 'Database',
    items: [
      { label: 'Schools', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, path: '/schools' },
      { label: 'Leads', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, path: '/leads' },
    ]
  },
  {
    label: 'Approval',
    items: [
      { label: 'Review', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, path: '/review' },
    ]
  },
];

const DASHBOARD_SECTIONS = [
  {
    label: 'Scraper',
    description: 'Data collection tools',
    color: '#00c896',
    bg: '#e8faf5',
    cards: [
      {
        title: 'CampusLabs Scraper',
        description: 'Scrape org contact info from any CampusLabs school directory',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c896" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
        path: '/scraper',
        active: true,
        tag: 'Active'
      }
    ]
  },
  {
    label: 'Viewer',
    description: 'Browse and export your data',
    color: '#3b82f6',
    bg: '#eff6ff',
    cards: [
      {
        title: 'Schools',
        description: 'View all schools from DecoGro with CampusLabs URLs and scrape status',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
        path: '/schools',
        active: true,
        tag: 'Active'
      },
      {
        title: 'Leads Viewer',
        description: 'Browse, filter, sort, and export all scraped leads',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
        path: '/leads',
        active: true,
        tag: 'Active'
      }
    ]
  },
  {
    label: 'Review',
    description: 'Requires human judgement',
    color: '#f59e0b',
    bg: '#fffbeb',
    cards: [
      {
        title: 'Org Review',
        description: 'Review unmatched orgs, edit names, and add to masterlist',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
        path: '/review',
        active: true,
        tag: 'Active'
      }
    ]
  },
  {
    label: 'Pending',
    description: 'Coming soon',
    color: '#9094a8',
    bg: '#f5f6fa',
    cards: [
      {
        title: 'Instagram Scanner',
        description: 'Scan Instagram accounts for contact info in recent posts',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9094a8" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
        path: null,
        active: false,
        tag: 'Coming Soon'
      }
    ]
  }
];

export default function Dashboard({ session }) {
  const navigate = useNavigate();
  const handleLogout = async () => { await supabase.auth.signOut(); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', Segoe UI, sans-serif", background: '#f5f6fa' }}>

      {/* Sidebar */}
      <div style={{ width: '200px', minHeight: '100vh', background: '#2d3561', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10 }}>
        <div style={{ padding: '20px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: '#00c896', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#fff' }}>R</div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '-0.2px' }}>Rushly</span>
          </div>
        </div>

        <div style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label} style={{ marginBottom: '4px' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '8px 8px 4px' }}>{section.label}</div>
              {section.items.map(item => (
                <div key={item.path} onClick={() => navigate(item.path)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '7px', cursor: 'pointer', color: item.path === '/dashboard' ? '#fff' : 'rgba(255,255,255,0.65)', background: item.path === '/dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent', fontSize: '13px', fontWeight: '500', marginBottom: '2px', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (item.path !== '/dashboard') { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}}
                  onMouseLeave={e => { if (item.path !== '/dashboard') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}}
                >{item.icon}{item.label}</div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.user?.email || ''}</div>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', width: '100%', textAlign: 'left' }}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 175px, flex: 1, padding: '32px' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1d2e', letterSpacing: '-0.3px' }}>Dashboard</div>
          <div style={{ fontSize: '13px', color: '#9094a8', marginTop: '2px' }}>Overview of all Rushly tools and modules</div>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {DASHBOARD_SECTIONS.map(section => (
            <div key={section.label}>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '3px', height: '18px', background: section.color, borderRadius: '2px' }} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a1d2e' }}>{section.label}</span>
                  <span style={{ fontSize: '12px', color: '#9094a8', marginLeft: '8px' }}>{section.description}</span>
                </div>
              </div>

              {/* Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', maxWidth: '900px' }}>
                {section.cards.map(card => (
                  <div key={card.title}
                    onClick={() => card.active && card.path && navigate(card.path)}
                    style={{
                      background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px',
                      padding: '20px', cursor: card.active ? 'pointer' : 'default',
                      opacity: card.active ? 1 : 0.6,
                      transition: 'box-shadow 0.15s, border-color 0.15s'
                    }}
                    onMouseEnter={e => { if (card.active) { e.currentTarget.style.boxShadow = `0 4px 20px ${section.color}20`; e.currentTarget.style.borderColor = section.color; }}}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e8eaf0'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ width: '38px', height: '38px', background: section.bg, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {card.icon}
                      </div>
                      <span style={{
                        fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '20px',
                        background: card.active ? section.bg : '#f5f6fa',
                        color: card.active ? section.color : '#9094a8',
                        letterSpacing: '0.3px'
                      }}>{card.tag}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1d2e', marginBottom: '5px' }}>{card.title}</div>
                    <div style={{ fontSize: '12px', color: '#9094a8', lineHeight: '1.6', marginBottom: '14px' }}>{card.description}</div>
                    {card.active && card.path && (
                      <div style={{ fontSize: '12px', color: section.color, fontWeight: '600' }}>Open →</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
