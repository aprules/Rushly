import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const DECOGRO_KEY = 'ak_live_14d8946a76e2c99814586ab48a64c555.sk_63c8b9956ddd90770208b352d9fb01b9ff463b4fdd4fd6548bb5663e2d951113';
const TABLE_ID = 'schools';

const NAV_SECTIONS = [
  { label: 'Menu', items: [
    { label: 'Dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, path: '/dashboard' },
  ]},
  { label: 'Tools', items: [
    { label: 'Scraper', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>, path: '/scraper' },
  ]},
  { label: 'Database', items: [
    { label: 'Schools', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, path: '/schools' },
    { label: 'Leads', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, path: '/leads' },
  ]},
  { label: 'Approval', items: [
    { label: 'Review', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, path: '/review' },
  ]},
];

const getStatus = (school) => {
  const status = school['CampusLabs Status'];
  if (!status || status.length === 0) return 'none';
  const val = status[0]?.value || '';
  if (val === 'Done') return 'done';
  if (val === 'In progress') return 'inprogress';
  return 'none';
};

export default function Schools({ session }) {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        table_id: TABLE_ID,
        limit: 50,
        page,
        ...(search && { search }),
      });
      const res = await fetch(`https://app.decogro.com/api/boards/data?${params}`, {
        headers: {
          'Authorization': `Bearer ${DECOGRO_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSchools(json.data.data || []);
        setTotalPages(json.data.pagination?.totalPages || 1);
        setTotal(json.data.pagination?.total || 0);
      } else {
        setError('Could not load schools from DecoGro.');
      }
    } catch(e) {
      setError('Failed to load schools. Please try again.');
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);
  useEffect(() => { setPage(1); }, [search, filterStatus]);

  const filtered = filterStatus ? schools.filter(s => getStatus(s) === filterStatus) : schools;

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const StatusBadge = ({ status }) => {
    if (status === 'done') return (
      <span style={{ fontSize: '11px', color: '#00c896', fontWeight: '600', background: '#e8faf5', padding: '3px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>✓ Done</span>
    );
    if (status === 'inprogress') return (
      <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600', background: '#fffbeb', padding: '3px 10px', borderRadius: '20px' }}>⏳ In Progress</span>
    );
    return (
      <span style={{ fontSize: '11px', color: '#9094a8', background: '#f5f6fa', padding: '3px 10px', borderRadius: '20px' }}>— Not started</span>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', Segoe UI, sans-serif", background: '#f5f6fa' }}>
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
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '7px', cursor: 'pointer', color: item.path === '/schools' ? '#fff' : 'rgba(255,255,255,0.65)', background: item.path === '/schools' ? 'rgba(255,255,255,0.1)' : 'transparent', fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}
                  onMouseEnter={e => { if (item.path !== '/schools') { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}}
                  onMouseLeave={e => { if (item.path !== '/schools') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}}
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

      <div style={{ marginLeft: '200px', flex: 1, padding: '32px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1d2e', letterSpacing: '-0.3px' }}>
              Schools
              {total > 0 && <span style={{ fontSize: '13px', fontWeight: '500', color: '#9094a8', marginLeft: '10px' }}>({total.toLocaleString()})</span>}
            </div>
            <div style={{ fontSize: '13px', color: '#9094a8', marginTop: '2px' }}>Synced from DecoGro — CampusLabs scrape status</div>
          </div>
          <button onClick={() => navigate('/scraper')} style={{ height: '36px', padding: '0 16px', background: '#00c896', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Scrape Schools
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '360px' }}>
            <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9094a8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search school name..."
              style={{ width: '100%', height: '36px', background: '#fff', border: '1px solid #e8eaf0', borderRadius: '7px', padding: '0 12px 0 32px', fontSize: '13px', color: '#1a1d2e', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ height: '36px', background: '#fff', border: '1px solid #e8eaf0', borderRadius: '7px', padding: '0 12px', fontSize: '13px', color: filterStatus ? '#1a1d2e' : '#9094a8', outline: 'none', cursor: 'pointer' }}>
            <option value="">All statuses</option>
            <option value="done">Done</option>
            <option value="inprogress">In Progress</option>
            <option value="none">Not Started</option>
          </select>
          {(search || filterStatus) && (
            <button onClick={() => { setSearch(''); setFilterStatus(''); }}
              style={{ height: '36px', background: '#fff', border: '1px solid #e8eaf0', borderRadius: '7px', padding: '0 12px', fontSize: '12px', color: '#e05c5c', cursor: 'pointer', fontWeight: '500' }}>
              ✕ Clear
            </button>
          )}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#b91c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {error}
            <button onClick={fetchSchools} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Retry</button>
          </div>
        )}

        <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f5f6fa', borderBottom: '1px solid #e8eaf0' }}>
                  {['School Name', 'CampusLabs URL', 'Status'].map(label => (
                    <th key={label} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#1a1d2e', fontSize: '12px', whiteSpace: 'nowrap' }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#9094a8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '20px', height: '20px', border: '2px solid #e8eaf0', borderTop: '2px solid #00c896', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Loading schools from DecoGro...
                    </div>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#9094a8' }}>No schools found.</td></tr>
                ) : filtered.map(school => {
                  const status = getStatus(school);
                  const url = school['Campus Labs Site'] || '';
                  return (
                    <tr key={school.record_id} style={{ borderBottom: '1px solid #f0f1f5' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 16px', color: '#1a1d2e', fontWeight: '500' }}>{school.name}</td>
                      <td style={{ padding: '10px 16px', maxWidth: '320px' }}>
                        {url
                          ? <a href={url} target="_blank" rel="noopener noreferrer"
                              style={{ color: '#2563eb', textDecoration: 'none', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                            >{url}</a>
                          : <span style={{ color: '#c5c7d4', fontSize: '12px' }}>No URL</span>
                        }
                      </td>
                      <td style={{ padding: '10px 16px' }}><StatusBadge status={status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #e8eaf0', background: '#f9fafb' }}>
              <div style={{ fontSize: '12px', color: '#9094a8' }}>Page {page} of {totalPages}</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ height: '30px', padding: '0 12px', background: '#fff', border: '1px solid #e8eaf0', borderRadius: '6px', fontSize: '12px', color: page === 1 ? '#c5c7d4' : '#1a1d2e', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  style={{ height: '30px', padding: '0 12px', background: '#fff', border: '1px solid #e8eaf0', borderRadius: '6px', fontSize: '12px', color: page >= totalPages ? '#c5c7d4' : '#1a1d2e', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
