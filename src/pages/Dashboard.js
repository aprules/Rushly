import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const STATIC_SECTIONS = [
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
        path: '/scraper', status: 'active',
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
        description: 'View all schools with CampusLabs URLs and scrape status',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
        path: '/schools', status: 'active',
      },
      {
        title: 'Leads Viewer',
        description: 'Browse, filter, sort, and export all scraped leads',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
        path: '/leads', status: 'active',
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
        path: '/review', status: 'active',
      }
    ]
  },
];

const STATUS_CONFIG = {
  active:       { label: 'Active',       color: '#00c896', bg: '#e8faf5', clickable: true  },
  coming_soon:  { label: 'Coming Soon',  color: '#405189', bg: '#eef0f8', clickable: false },
  planned:      { label: 'Planned',      color: '#9094a8', bg: '#f5f6fa', clickable: false },
};

export default function Dashboard({ session }) {
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState([]);
  const [plannedOpen, setPlannedOpen] = useState(false);

  useEffect(() => {
    supabase.from('roadmap').select('*').order('sort_order', { ascending: true }).then(({ data }) => {
      if (data) setRoadmap(data);
    });
  }, []);

  const getStatusStyle = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.planned;

  const comingSoon = roadmap.filter(c => c.status === 'coming_soon');
  const planned = roadmap.filter(c => c.status === 'planned');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', Segoe UI, sans-serif", background: '#f5f6fa' }}>
      <Sidebar session={session} />
      <div style={{ marginLeft: '175px', flex: 1, padding: '32px' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1d2e', letterSpacing: '-0.3px' }}>Dashboard</div>
          <div style={{ fontSize: '13px', color: '#9094a8', marginTop: '2px' }}>Overview of all Rushly tools and modules</div>
        </div>

        {/* Static active sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {STATIC_SECTIONS.map(section => (
            <div key={section.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '3px', height: '18px', background: section.color, borderRadius: '2px' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a1d2e' }}>{section.label}</span>
                <span style={{ fontSize: '12px', color: '#9094a8', marginLeft: '4px' }}>{section.description}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', maxWidth: '900px' }}>
                {section.cards.map(card => {
                  const st = getStatusStyle(card.status);
                  return (
                    <div key={card.title}
                      onClick={() => st.clickable && card.path && navigate(card.path)}
                      style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px', padding: '20px', cursor: st.clickable ? 'pointer' : 'default', transition: 'box-shadow 0.15s, border-color 0.15s' }}
                      onMouseEnter={e => { if (st.clickable) { e.currentTarget.style.boxShadow = `0 4px 20px ${section.color}20`; e.currentTarget.style.borderColor = section.color; }}}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e8eaf0'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ width: '38px', height: '38px', background: section.bg, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</div>
                        <span style={{ fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '20px', background: st.bg, color: st.color, letterSpacing: '0.3px' }}>{st.label}</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1d2e', marginBottom: '5px' }}>{card.title}</div>
                      <div style={{ fontSize: '12px', color: '#9094a8', lineHeight: '1.6', marginBottom: '14px' }}>{card.description}</div>
                      {st.clickable && card.path && <div style={{ fontSize: '12px', color: section.color, fontWeight: '600' }}>Open →</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Coming Soon section */}
          {comingSoon.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '3px', height: '18px', background: '#405189', borderRadius: '2px' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a1d2e' }}>Coming Soon</span>
                <span style={{ fontSize: '12px', color: '#9094a8', marginLeft: '4px' }}>In active development</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', maxWidth: '900px' }}>
                {comingSoon.map(card => {
                  const st = getStatusStyle(card.status);
                  return (
                    <div key={card.id} style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px', padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ width: '38px', height: '38px', background: st.bg, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{card.icon_emoji || '🔜'}</div>
                        <span style={{ fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '20px', background: st.bg, color: st.color, letterSpacing: '0.3px' }}>{st.label}</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1d2e', marginBottom: '5px' }}>{card.title}</div>
                      <div style={{ fontSize: '12px', color: '#9094a8', lineHeight: '1.6' }}>{card.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Planned section — collapsed by default */}
          {planned.length > 0 && (
            <div>
              <div
                onClick={() => setPlannedOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: plannedOpen ? '12px' : '0', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ width: '3px', height: '18px', background: '#c8cad6', borderRadius: '2px' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#9094a8' }}>Planned</span>
                <span style={{ fontSize: '12px', color: '#b0b3c6', marginLeft: '4px' }}>Future ideas</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9094a8" strokeWidth="2.5"
                  style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: plannedOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              {plannedOpen && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', maxWidth: '900px' }}>
                  {planned.map(card => {
                    const st = getStatusStyle(card.status);
                    return (
                      <div key={card.id} style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px', padding: '20px', opacity: 0.55 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div style={{ width: '38px', height: '38px', background: st.bg, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{card.icon_emoji || '📋'}</div>
                          <span style={{ fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '20px', background: st.bg, color: st.color, letterSpacing: '0.3px' }}>{st.label}</span>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1d2e', marginBottom: '5px' }}>{card.title}</div>
                        <div style={{ fontSize: '12px', color: '#9094a8', lineHeight: '1.6' }}>{card.description}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
