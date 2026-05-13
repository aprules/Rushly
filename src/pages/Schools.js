import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const NAV_SECTIONS = [
  { label: 'Menu', items: [
    { label: 'Dashboard', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, path: '/dashboard' },
  ]},
  { label: 'Tools', items: [
    { label: 'Scraper', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>, path: '/scraper' },
  ]},
  { label: 'Database', items: [
    { label: 'Schools', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, path: '/schools' },
    { label: 'Leads', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, path: '/leads' },
  ]},
  { label: 'Approval', items: [
    { label: 'Review', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, path: '/review' },
  ]},
];

const PAGE_SIZE = 50;

async function searchCampusLabsUrl(schoolName) {
  try {
    
    const res = await fetch(`https://api.anthropic.com/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `What is the CampusLabs Engage URL for ${schoolName}? It typically looks like https://schoolname.campuslabs.com/engage or https://schoolname.campuslabs.com/engage/organizations. Reply with ONLY the URL or "none" if you don't know it.`
        }]
      })
    });
    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() || 'none';
    if (text === 'none' || !text.includes('campuslabs.com')) return null;
    return text;
  } catch(e) {
    return null;
  }
}

export default function Schools({ session }) {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Find URLs state
  const [finding, setFinding] = useState(false);
  const [findProgress, setFindProgress] = useState({ current: 0, total: 0, found: 0, notFound: 0 });
  const [findResults, setFindResults] = useState([]);
  const stopFindRef = useRef(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('schools')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);

      if (filterStatus === 'pending') {
        query = query.eq('status', 'pending').not('campuslabs_url', 'is', null).neq('campuslabs_url', '');
      } else if (filterStatus === 'no_url') {
        query = query.eq('status', 'pending').or('campuslabs_url.is.null,campuslabs_url.eq.');
      } else if (filterStatus === 'needs_review') {
        query = query.eq('status', 'needs_review');
      } else if (filterStatus === 'in_progress') {
        query = query.eq('status', 'in_progress');
      } else if (filterStatus === 'done') {
        query = query.eq('status', 'done');
      }

      const { data, count, error: err } = await query;
      if (err) throw err;
      setSchools(data || []);
      setTotal(count || 0);
    } catch (e) {
      setError('Failed to load schools.');
    }
    setLoading(false);
  }, [page, search, filterStatus]);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);
  useEffect(() => { setPage(1); }, [search, filterStatus]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  // Find CampusLabs URLs for no-URL schools
  const handleFindUrls = async () => {
    const { data: noUrlSchools } = await supabase
      .from('schools')
      .select('id, name')
      .eq('status', 'pending')
      .or('campuslabs_url.is.null,campuslabs_url.eq.')
      .order('name', { ascending: true })
      .limit(50);

    if (!noUrlSchools || noUrlSchools.length === 0) return;

    setFinding(true);
    stopFindRef.current = false;
    setFindResults([]);
    setFindProgress({ current: 0, total: noUrlSchools.length, found: 0, notFound: 0 });

    let found = 0, notFound = 0;
    const results = [];

    for (let i = 0; i < noUrlSchools.length; i++) {
      if (stopFindRef.current) break;
      const school = noUrlSchools[i];
      const url = await searchCampusLabsUrl(school.name);

      if (url) {
        await supabase.from('schools').update({ suggested_url: url, status: 'needs_review' }).eq('id', school.id);
        found++;
        results.push({ id: school.id, name: school.name, url, found: true });
      } else {
        notFound++;
        results.push({ id: school.id, name: school.name, url: null, found: false });
      }

      setFindProgress({ current: i + 1, total: noUrlSchools.length, found, notFound });
      setFindResults([...results]);
    }

    setFinding(false);
    fetchSchools();
  };

  // Approve suggested URL
  const handleApprove = async (school) => {
    await supabase.from('schools').update({
      campuslabs_url: school.suggested_url,
      suggested_url: null,
      status: 'pending'
    }).eq('id', school.id);
    fetchSchools();
  };

  // Reject suggested URL
  const handleReject = async (school) => {
    await supabase.from('schools').update({
      suggested_url: null,
      status: 'pending',
      campuslabs_url: null
    }).eq('id', school.id);
    fetchSchools();
  };

  const StatusBadge = ({ school }) => {
    if (school.status === 'done') return <span style={{ fontSize: '11px', color: '#00c896', fontWeight: '600', background: '#e8faf5', padding: '3px 10px', borderRadius: '20px' }}>✓ Done</span>;
    if (school.status === 'in_progress') return <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600', background: '#fffbeb', padding: '3px 10px', borderRadius: '20px' }}>⏳ In Progress</span>;
    if (school.status === 'needs_review') return <span style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: '600', background: '#f5f3ff', padding: '3px 10px', borderRadius: '20px' }}>👁 Needs Review</span>;
    if (!school.campuslabs_url) return <span style={{ fontSize: '11px', color: '#e05c5c', fontWeight: '500', background: '#fef2f2', padding: '3px 10px', borderRadius: '20px' }}>✕ No URL</span>;
    return <span style={{ fontSize: '11px', color: '#9094a8', background: '#f5f6fa', padding: '3px 10px', borderRadius: '20px' }}>— Pending</span>;
  };

  const currentPath = '/schools';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', Segoe UI, sans-serif", background: '#f5f6fa' }}>

      {/* Sidebar */}
      <div style={{ width: '220px', minHeight: '100vh', background: '#1e2a4a', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10 }}>
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="7" fill="#00c896"/><text x="7" y="20" fontSize="15" fontWeight="800" fill="white" fontFamily="DM Sans, sans-serif">R</text></svg>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '-0.3px' }}><span style={{ color: '#00c896' }}>R</span>ushly</span>
          </div>
        </div>
        <div style={{ padding: '10px 12px', flex: 1, overflowY: 'auto' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label} style={{ marginBottom: '2px' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', padding: '10px 8px 4px', fontWeight: '600' }}>{section.label}</div>
              {section.items.map(item => {
                const isActive = item.path === currentPath;
                return (
                  <div key={item.path} onClick={() => navigate(item.path)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', marginBottom: '1px', transition: 'all 0.15s', color: isActive ? '#fff' : 'rgba(255,255,255,0.55)', background: isActive ? 'rgba(0,200,150,0.15)' : 'transparent', borderLeft: isActive ? '3px solid #00c896' : '3px solid transparent', fontSize: '13px', fontWeight: isActive ? '600' : '400' }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}}
                  ><span style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>{item.label}</div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#00c896', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
              {session?.user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.user?.email || ''}</div>
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '5px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', width: '100%', textAlign: 'left' }}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1d2e', letterSpacing: '-0.3px' }}>
              Schools
              {total > 0 && <span style={{ fontSize: '13px', fontWeight: '500', color: '#9094a8', marginLeft: '10px' }}>({total.toLocaleString()})</span>}
            </div>
            <div style={{ fontSize: '13px', color: '#9094a8', marginTop: '2px' }}>All schools — CampusLabs scrape targets</div>
          </div>
          <button onClick={() => navigate('/scraper')} style={{ height: '36px', padding: '0 16px', background: '#00c896', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Scrape Schools
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '360px' }}>
            <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9094a8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search school name..."
              style={{ width: '100%', height: '36px', background: '#fff', border: '1px solid #e8eaf0', borderRadius: '7px', padding: '0 12px 0 32px', fontSize: '13px', color: '#1a1d2e', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ height: '36px', background: '#fff', border: '1px solid #e8eaf0', borderRadius: '7px', padding: '0 12px', fontSize: '13px', color: filterStatus ? '#1a1d2e' : '#9094a8', outline: 'none', cursor: 'pointer' }}>
            <option value="">All schools</option>
            <option value="pending">Pending (has URL)</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="no_url">No URL</option>
            <option value="needs_review">Needs Review</option>
          </select>
          {(search || filterStatus) && (
            <button onClick={() => { setSearch(''); setFilterStatus(''); }}
              style={{ height: '36px', background: '#fff', border: '1px solid #e8eaf0', borderRadius: '7px', padding: '0 12px', fontSize: '12px', color: '#e05c5c', cursor: 'pointer', fontWeight: '500' }}>✕ Clear</button>
          )}
          {filterStatus === 'no_url' && !finding && (
            <button onClick={handleFindUrls}
              style={{ height: '36px', padding: '0 16px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Find CampusLabs URLs
            </button>
          )}
          {finding && (
            <button onClick={() => { stopFindRef.current = true; }}
              style={{ height: '36px', padding: '0 16px', background: '#e05c5c', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              ✕ Stop
            </button>
          )}
        </div>

        {/* Find progress */}
        {(finding || findResults.length > 0) && (
          <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1d2e' }}>
                {finding ? `Searching... ${findProgress.current} / ${findProgress.total}` : `Done — ${findProgress.found} found, ${findProgress.notFound} not found`}
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                <span style={{ color: '#00c896', fontWeight: '600' }}>✓ {findProgress.found} found</span>
                <span style={{ color: '#e05c5c', fontWeight: '600' }}>✗ {findProgress.notFound} not found</span>
              </div>
            </div>
            <div style={{ height: '4px', background: '#e8eaf0', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ height: '100%', background: '#8b5cf6', borderRadius: '2px', transition: 'width 0.3s ease', width: findProgress.total ? `${(findProgress.current / findProgress.total) * 100}%` : '0%' }} />
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {findResults.slice().reverse().map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #f5f6fa' }}>
                  <span style={{ color: r.found ? '#00c896' : '#e05c5c', fontWeight: '600', flexShrink: 0 }}>{r.found ? '✓' : '✗'}</span>
                  <span style={{ color: '#1a1d2e', fontWeight: '500', flexShrink: 0, minWidth: '200px' }}>{r.name}</span>
                  {r.url && <span style={{ color: '#2563eb', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#b91c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {error}
            <button onClick={fetchSchools} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Retry</button>
          </div>
        )}

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f5f6fa', borderBottom: '1px solid #e8eaf0' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#1a1d2e', fontSize: '12px' }}>#</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#1a1d2e', fontSize: '12px' }}>School Name</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#1a1d2e', fontSize: '12px' }}>CampusLabs URL</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#1a1d2e', fontSize: '12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#9094a8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '20px', height: '20px', border: '2px solid #e8eaf0', borderTop: '2px solid #00c896', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Loading schools...
                    </div>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </td></tr>
                ) : schools.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#9094a8' }}>No schools found.</td></tr>
                ) : schools.map((school, i) => (
                  <tr key={school.id} style={{ borderBottom: '1px solid #f0f1f5' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 16px', color: '#c5c7d4', fontSize: '12px' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td style={{ padding: '10px 16px', color: '#1a1d2e', fontWeight: '500' }}>{school.name}</td>
                    <td style={{ padding: '10px 16px', maxWidth: '320px' }}>
                      {school.status === 'needs_review' && school.suggested_url ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <a href={school.suggested_url} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#8b5cf6', textDecoration: 'none', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px', display: 'block' }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                          >{school.suggested_url}</a>
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button onClick={() => handleApprove(school)}
                              style={{ height: '24px', padding: '0 10px', background: '#00c896', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>✓ Good</button>
                            <button onClick={() => handleReject(school)}
                              style={{ height: '24px', padding: '0 10px', background: '#fef2f2', color: '#e05c5c', border: '1px solid #fecaca', borderRadius: '5px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>✗ No Good</button>
                          </div>
                        </div>
                      ) : school.campuslabs_url ? (
                        <a href={school.campuslabs_url} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >{school.campuslabs_url}</a>
                      ) : (
                        <span style={{ color: '#c5c7d4', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}><StatusBadge school={school} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #e8eaf0', background: '#f9fafb' }}>
              <div style={{ fontSize: '12px', color: '#9094a8' }}>Page {page} of {totalPages} · {total.toLocaleString()} schools</div>
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
