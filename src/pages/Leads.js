import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../supabaseClient';

const PAGE_SIZE_OPTIONS = [50, 100, 150];

export default function Leads({ session }) {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [schools, setSchools] = useState([]);
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState('company');
  const [sortAsc, setSortAsc] = useState(true);
  const [pageSize, setPageSize] = useState(50);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .order(sortCol, { ascending: sortAsc })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (search) {
        query = query.or(`company.ilike.%${search}%,email_address.ilike.%${search}%,phone_number.ilike.%${search}%`);
      }

      if (filterSchool) {
        // Company format is "OrgName SchoolName" so filter by suffix
        query = query.ilike('company', `%${filterSchool}`);
      }

      const { data, count, error } = await query;
      if (!error) {
        setLeads(data || []);
        setTotal(count || 0);
      }
    } catch(e) {}
    setLoading(false);
  }, [search, filterSchool, page, sortCol, sortAsc, pageSize]);

  // Fetch unique schools for filter
  useEffect(() => {
    supabase.from('companies').select('school').then(({ data }) => {
      if (data) {
        const unique = [...new Set(data.map(r => r.school).filter(Boolean))].sort();
        setSchools(unique);
      }
    });
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset page on search/filter change
  useEffect(() => {
    setPage(0);
  }, [search, filterSchool, pageSize]);

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(a => !a);
    else { setSortCol(col); setSortAsc(true); }
  };

  const handleExport = () => {
    if (leads.length === 0) return;
    const headers = ['First Name', 'Last Name', 'Company', 'Phone Number', 'Email'];
    const rows = leads.map(r => [
      r.first_name || '', r.last_name || '', r.company || '',
      r.phone_number || '', r.email_address || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rushly-leads.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ color: '#ccc', marginLeft: '4px' }}>↕</span>;
    return <span style={{ color: '#00c896', marginLeft: '4px' }}>{sortAsc ? '↑' : '↓'}</span>;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', Segoe UI, sans-serif", background: '#f5f6fa' }} className='rly-main'>

      {/* Sidebar */}
      <Sidebar session={session} />


      {/* Main */}
      <div style={{ marginLeft: '175px', flex: 1, padding: '32px', minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1d2e', letterSpacing: '-0.3px' }}>
              Leads
              {total > 0 && <span style={{ fontSize: '13px', fontWeight: '500', color: '#9094a8', marginLeft: '10px' }}>({total.toLocaleString()})</span>}
            </div>
            <div style={{ fontSize: '13px', color: '#9094a8', marginTop: '2px' }}>All scraped contacts from CampusLabs</div>
          </div>
          <button onClick={handleExport} style={{
            background: '#00c896', color: '#fff', border: 'none', borderRadius: '7px',
            padding: '8px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 2px 8px rgba(0,200,150,0.3)'
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '360px' }}>
            <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9094a8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search company, email, phone..."
              style={{
                width: '100%', height: '36px', background: '#fff',
                border: '1px solid #e8eaf0', borderRadius: '7px',
                padding: '0 12px 0 32px', fontSize: '13px', color: '#1a1d2e',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* School filter */}
          {schools.length > 0 && (
            <select
              value={filterSchool}
              onChange={e => setFilterSchool(e.target.value)}
              style={{
                height: '36px', background: '#fff', border: '1px solid #e8eaf0',
                borderRadius: '7px', padding: '0 12px', fontSize: '13px',
                color: filterSchool ? '#1a1d2e' : '#9094a8', outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="">All schools</option>
              {schools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {/* Page size */}
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }} style={{
            height: '36px', background: '#fff', border: '1px solid #e8eaf0',
            borderRadius: '7px', padding: '0 12px', fontSize: '13px',
            color: '#1a1d2e', outline: 'none', cursor: 'pointer'
          }}>
            {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s} per page</option>)}
          </select>

          {/* Clear filters */}
          {(search || filterSchool) && (
            <button onClick={() => { setSearch(''); setFilterSchool(''); }} style={{
              height: '36px', background: '#fff', border: '1px solid #e8eaf0',
              borderRadius: '7px', padding: '0 12px', fontSize: '12px',
              color: '#e05c5c', cursor: 'pointer', fontWeight: '500'
            }}>✕ Clear filters</button>
          )}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px', overflow: 'hidden' }} className='rly-card rly-border'>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f5f6fa', borderBottom: '1px solid #e8eaf0' }} className='rly-thead rly-border'>
                  {[
                    { label: 'First Name', col: 'first_name' },
                    { label: 'Last Name', col: 'last_name' },
                    { label: 'Company', col: 'company' },
                    { label: 'Phone Number', col: 'phone_number' },
                    { label: 'Email', col: 'email_address' },
                  ].map(({ label, col }) => (
                    <th key={col} onClick={() => handleSort(col)} style={{
                      padding: '10px 16px', textAlign: 'left', fontWeight: '600',
                      color: '#1a1d2e', fontSize: '12px', cursor: 'pointer',
                      whiteSpace: 'nowrap', userSelect: 'none',
                      letterSpacing: '0.1px'
                    }}>
                      {label}<SortIcon col={col} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#9094a8', fontSize: '13px' }}>
                      Loading...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#9094a8', fontSize: '13px' }}>
                      {search || filterSchool ? 'No leads match your filters.' : 'No leads yet. Run a scrape to get started.'}
                    </td>
                  </tr>
                ) : (
                  leads.map((lead, i) => (
                    <tr key={lead.id || i} style={{ borderBottom: '1px solid #f0f1f5', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 16px', color: '#1a1d2e' }}>{lead.first_name || '—'}</td>
                      <td style={{ padding: '10px 16px', color: '#1a1d2e' }}>{lead.last_name || '—'}</td>
                      <td style={{ padding: '10px 16px', color: '#1a1d2e', fontWeight: '500', maxWidth: '280px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lead.company || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', color: lead.phone_number ? '#1a1d2e' : '#c5c7d4', whiteSpace: 'nowrap' }}>
                        {lead.phone_number || '—'}
                      </td>
                      <td style={{ padding: '10px 16px', color: lead.email_address ? '#2563eb' : '#c5c7d4' }}>
                        {lead.email_address
                          ? <a href={`mailto:${lead.email_address}`} style={{ color: '#2563eb', textDecoration: 'none' }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                            >{lead.email_address}</a>
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderTop: '1px solid #e8eaf0', background: '#f9fafb'
            }}>
              <div style={{ fontSize: '12px', color: '#9094a8' }}>
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total.toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    height: '30px', padding: '0 12px', background: '#fff',
                    border: '1px solid #e8eaf0', borderRadius: '6px', fontSize: '12px',
                    color: page === 0 ? '#c5c7d4' : '#1a1d2e', cursor: page === 0 ? 'not-allowed' : 'pointer'
                  }}
                >← Prev</button>
                <span style={{ height: '30px', padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: '12px', color: '#9094a8' }}>
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{
                    height: '30px', padding: '0 12px', background: '#fff',
                    border: '1px solid #e8eaf0', borderRadius: '6px', fontSize: '12px',
                    color: page >= totalPages - 1 ? '#c5c7d4' : '#1a1d2e',
                    cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer'
                  }}
                >Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
