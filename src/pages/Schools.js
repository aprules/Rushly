import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const FIND_BATCH_SIZE = 100;
const PAGE_SIZE = 100;

async function searchCampusLabsUrl(schoolName) {
  try {
    const res = await fetch('/api/find-campuslabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolName })
    });
    const data = await res.json();
    return data.url || null;
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
  const [noUrlTotal, setNoUrlTotal] = useState(0);
  const [findPage, setFindPage] = useState(1);
  const [finding, setFinding] = useState(false);
  const [findProgress, setFindProgress] = useState({ current: 0, total: 0, found: 0, notFound: 0 });
  const [findResults, setFindResults] = useState([]);
  const [pageInput, setPageInput] = useState('');
  const stopFindRef = useRef(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const findTotalPages = Math.ceil(noUrlTotal / FIND_BATCH_SIZE);

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

      // Also fetch total no-url count for batch pages
      if (filterStatus === 'no_url' || filterStatus === '') {
        const { count: noUrlCount } = await supabase
          .from('schools')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .or('campuslabs_url.is.null,campuslabs_url.eq.');
        setNoUrlTotal(noUrlCount || 0);
      }
    } catch (e) {
      setError('Failed to load schools.');
    }
    setLoading(false);
  }, [page, search, filterStatus]);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);
  useEffect(() => { setPage(1); }, [search, filterStatus]);

  const handlePageJump = (e) => {
    if (e.key === 'Enter') {
      const num = parseInt(pageInput);
      if (!isNaN(num) && num >= 1 && num <= totalPages) setPage(num);
      setPageInput('');
    }
  };

  const handleFindUrls = async () => {
    // Fetch the specific batch/page of no-url schools
    const { data: noUrlSchools } = await supabase
      .from('schools')
      .select('id, name')
      .eq('status', 'pending')
      .or('campuslabs_url.is.null,campuslabs_url.eq.')
      .order('name', { ascending: true })
      .range((findPage - 1) * FIND_BATCH_SIZE, findPage * FIND_BATCH_SIZE - 1);

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
        const { data: existing } = await supabase
          .from('schools')
          .select('id, name')
          .or(`campuslabs_url.eq.${url},suggested_url.eq.${url}`)
          .neq('id', school.id)
          .limit(1);
        if (existing && existing.length > 0) {
          notFound++;
          results.push({ id: school.id, name: school.name, url: null, found: false, note: `duplicate of ${existing[0].name}` });
        } else {
          await supabase.from('schools').update({ suggested_url: url, status: 'needs_review' }).eq('id', school.id);
          found++;
          results.push({ id: school.id, name: school.name, url, found: true });
        }
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

  const handleApprove = async (school) => {
    await supabase.from('schools').update({ campuslabs_url: school.suggested_url, suggested_url: null, status: 'pending' }).eq('id', school.id);
    fetchSchools();
  };

  const handleReject = async (school) => {
    await supabase.from('schools').update({ suggested_url: null, status: 'pending', campuslabs_url: null }).eq('id', school.id);
    fetchSchools();
  };

  const StatusBadge = ({ school }) => {
    if (school.status === 'done') return <span style={{ fontSize: '11px', color: '#00c896', fontWeight: '600', background: '#e8faf5', padding: '3px 10px', borderRadius: '20px' }}>✓ Done</span>;
    if (school.status === 'in_progress') return <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600', background: '#fffbeb', padding: '3px 10px', borderRadius: '20px' }}>⏳ In Progress</span>;
    if (school.status === 'needs_review') return <span style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: '600', background: '#f5f3ff', padding: '3px 10px', borderRadius: '20px' }}>👁 Needs Review</span>;
    if (!school.campuslabs_url) return <span style={{ fontSize: '11px', color: '#e05c5c', fontWeight: '500', background: '#fef2f2', padding: '3px 10px', borderRadius: '20px' }}>✕ No URL</span>;
    return <span style={{ fontSize: '11px', color: '#9094a8', background: '#f5f6fa', padding: '3px 10px', borderRadius: '20px' }}>— Pending</span>;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', Segoe UI, sans-serif", background: '#f5f6fa' }}>

      {/* Sidebar */}
      <Sidebar session={session} />

      {/* Main */}
      <div style={{ marginLeft: '200px', flex: 1, padding: '32px', minWidth: 0 }}>
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
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
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
        </div>

        {/* Find URLs panel — only shown when No URL filter is active */}
        {filterStatus === 'no_url' && (
          <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: finding || findResults.length > 0 ? '12px' : '0' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1d2e' }}>Find CampusLabs URLs</div>
                <div style={{ fontSize: '11px', color: '#9094a8', marginTop: '2px' }}>
                  {noUrlTotal} schools without URL · {findTotalPages} pages of 100
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!finding && (
                  <>
                    <select
                      value={findPage}
                      onChange={e => { setFindPage(Number(e.target.value)); setFindResults([]); }}
                      style={{ height: '34px', background: '#f5f6fa', border: '1px solid #e8eaf0', borderRadius: '6px', padding: '0 10px', fontSize: '12px', color: '#1a1d2e', outline: 'none', cursor: 'pointer' }}
                    >
                      {Array.from({ length: findTotalPages }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Page {i + 1} (#{i * FIND_BATCH_SIZE + 1}–{Math.min((i + 1) * FIND_BATCH_SIZE, noUrlTotal)})
                        </option>
                      ))}
                    </select>
                    <button onClick={handleFindUrls}
                      style={{ height: '34px', padding: '0 16px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      Search Page {findPage}
                    </button>
                  </>
                )}
                {finding && (
                  <button onClick={() => { stopFindRef.current = true; }}
                    style={{ height: '34px', padding: '0 14px', background: '#e05c5c', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    ✕ Stop
                  </button>
                )}
              </div>
            </div>

            {/* Progress */}
            {(finding || findResults.length > 0) && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: '#9094a8' }}>
                    {finding ? `Searching ${findProgress.current} of ${findProgress.total}...` : `Completed — page ${findPage}`}
                  </span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ color: '#00c896', fontWeight: '600' }}>✓ {findProgress.found} found</span>
                    <span style={{ color: '#e05c5c', fontWeight: '600' }}>✗ {findProgress.notFound} not found</span>
                  </div>
                </div>
                <div style={{ height: '4px', background: '#e8eaf0', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ height: '100%', background: '#8b5cf6', borderRadius: '2px', transition: 'width 0.3s ease', width: findProgress.total ? `${(findProgress.current / findProgress.total) * 100}%` : '0%' }} />
                </div>
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {findResults.slice().reverse().map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '3px 0', borderBottom: '1px solid #f5f6fa' }}>
                      <span style={{ color: r.found ? '#00c896' : '#e05c5c', fontWeight: '700', flexShrink: 0, width: '12px' }}>{r.found ? '✓' : '✗'}</span>
                      <span style={{ color: '#1a1d2e', fontWeight: '500', flexShrink: 0, minWidth: '200px' }}>{r.name}</span>
                      {r.url && <span style={{ color: '#8b5cf6', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{r.url}</span>}
                      {r.note && <span style={{ color: '#f59e0b', fontSize: '11px', flexShrink: 0 }}>⚠ {r.note}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
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
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#1a1d2e', fontSize: '12px' }}>{filterStatus === 'needs_review' ? 'Action' : 'Status'}</th>
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
                    <td style={{ padding: '10px 16px' }}>
                      {school.status === 'needs_review' && school.suggested_url ? (
                        <a href={school.suggested_url} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#8b5cf6', textDecoration: 'none', fontSize: '12px' }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >{school.suggested_url}</a>
                      ) : school.campuslabs_url ? (
                        <a href={school.campuslabs_url} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '12px' }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >{school.campuslabs_url}</a>
                      ) : (
                        <span style={{ color: '#c5c7d4', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {school.status === 'needs_review' && school.suggested_url ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button onClick={() => handleApprove(school)} style={{ height: '26px', padding: '0 12px', background: '#00c896', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>✓ Good</button>
                          <button onClick={() => handleReject(school)} style={{ height: '26px', padding: '0 12px', background: '#fef2f2', color: '#e05c5c', border: '1px solid #fecaca', borderRadius: '5px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>✗ No Good</button>
                        </div>
                      ) : (
                        <StatusBadge school={school} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #e8eaf0', background: '#f9fafb' }}>
              <div style={{ fontSize: '12px', color: '#9094a8' }}>Page {page} of {totalPages} · {total.toLocaleString()} schools</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ height: '30px', padding: '0 12px', background: '#fff', border: '1px solid #e8eaf0', borderRadius: '6px', fontSize: '12px', color: page === 1 ? '#c5c7d4' : '#1a1d2e', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                <input value={pageInput} onChange={e => setPageInput(e.target.value)} onKeyDown={handlePageJump}
                  placeholder={String(page)}
                  style={{ width: '48px', height: '30px', border: '1px solid #e8eaf0', borderRadius: '6px', textAlign: 'center', fontSize: '12px', color: '#1a1d2e', outline: 'none' }} />
                <span style={{ fontSize: '12px', color: '#9094a8' }}>of {totalPages}</span>
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
