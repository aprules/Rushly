import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

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

export default function Review({ session }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [schools, setSchools] = useState([]);
  const [saving, setSaving] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [editOrg, setEditOrg] = useState('');
  const [editCompany, setEditCompany] = useState('');

  const fetchReview = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('review').select('*').eq('atm', false).order('id', { ascending: false });
      if (search) query = query.ilike('organization', `%${search}%`);
      if (filterSchool) query = query.ilike('school', `%${filterSchool}%`);
      const { data } = await query;
      setRows(data || []);
    } catch(e) {}
    setLoading(false);
  }, [search, filterSchool]);

  useEffect(() => { fetchReview(); }, [fetchReview]);

  useEffect(() => {
    supabase.from('review').select('school').then(({ data }) => {
      if (data) {
        const unique = [...new Set(data.map(r => r.school).filter(Boolean))].sort();
        setSchools(unique);
      }
    });
  }, []);

  const handleExpand = (row) => {
    if (expanded === row.id) {
      setExpanded(null);
    } else {
      setExpanded(row.id);
      setEditOrg(row.organization || '');
      setEditCompany(row.companies || '');
    }
  };

  const handleOrgChange = (val, school) => {
    setEditOrg(val);
    setEditCompany(val ? `${val} ${school}` : '');
  };

  const handleSave = async (row) => {
    setSaving(prev => ({ ...prev, [row.id]: 'saving' }));
    try {
      const oldCompany = row.companies;
      // Update review row + mark as added to masterlist
      await supabase.from('review').update({ organization: editOrg, companies: editCompany, atm: true }).eq('id', row.id);
      // Cascade to leads and companies
      if (oldCompany !== editCompany) {
        await supabase.from('leads').update({ company: editCompany }).eq('company', oldCompany);
        await supabase.from('companies').update({ companies: editCompany, organization: editOrg }).eq('companies', oldCompany);
      }
      setSaving(prev => ({ ...prev, [row.id]: 'saved' }));
      // Remove from list after short delay
      setTimeout(() => {
        setRows(prev => prev.filter(r => r.id !== row.id));
        setSaving(prev => ({ ...prev, [row.id]: null }));
        setExpanded(null);
      }, 1000);
    } catch(e) {
      setSaving(prev => ({ ...prev, [row.id]: null }));
    }
  };

  const handleAtm = async (row) => {
    setSaving(prev => ({ ...prev, [row.id]: 'atm' }));
    try {
      await supabase.from('review').update({ atm: true }).eq('id', row.id);
      // Remove from list after short delay
      setTimeout(() => {
        setRows(prev => prev.filter(r => r.id !== row.id));
        setSaving(prev => ({ ...prev, [row.id]: null }));
      }, 800);
    } catch(e) {
      setSaving(prev => ({ ...prev, [row.id]: null }));
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

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
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '7px', cursor: 'pointer', color: item.path === '/review' ? '#fff' : 'rgba(255,255,255,0.65)', background: item.path === '/review' ? 'rgba(255,255,255,0.1)' : 'transparent', fontSize: '13px', fontWeight: '500', marginBottom: '2px', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (item.path !== '/review') { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}}
                  onMouseLeave={e => { if (item.path !== '/review') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}}
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
              Review
              {rows.length > 0 && <span style={{ fontSize: '13px', fontWeight: '500', color: '#9094a8', marginLeft: '10px' }}>({rows.length.toLocaleString()})</span>}
            </div>
            <div style={{ fontSize: '13px', color: '#9094a8', marginTop: '2px' }}>Click a row to edit — changes sync to Leads and Companies</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '360px' }}>
            <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9094a8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organization..." style={{ width: '100%', height: '36px', background: '#fff', border: '1px solid #e8eaf0', borderRadius: '7px', padding: '0 12px 0 32px', fontSize: '13px', color: '#1a1d2e', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {schools.length > 0 && (
            <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)} style={{ height: '36px', background: '#fff', border: '1px solid #e8eaf0', borderRadius: '7px', padding: '0 12px', fontSize: '13px', color: filterSchool ? '#1a1d2e' : '#9094a8', outline: 'none', cursor: 'pointer' }}>
              <option value="">All schools</option>
              {schools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {(search || filterSchool) && (
            <button onClick={() => { setSearch(''); setFilterSchool(''); }} style={{ height: '36px', background: '#fff', border: '1px solid #e8eaf0', borderRadius: '7px', padding: '0 12px', fontSize: '12px', color: '#e05c5c', cursor: 'pointer', fontWeight: '500' }}>✕ Clear filters</button>
          )}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f5f6fa', borderBottom: '1px solid #e8eaf0' }}>
                  {['', 'Company', 'Organization', 'School', 'Add to Masterlist'].map((label, i) => (
                    <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#1a1d2e', fontSize: '12px', whiteSpace: 'nowrap' }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#9094a8' }}>Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#9094a8' }}>
                    {search || filterSchool ? 'No results match your filters.' : 'No unmatched orgs to review.'}
                  </td></tr>
                ) : rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      onClick={() => handleExpand(row)}
                      style={{ borderBottom: expanded === row.id ? 'none' : '1px solid #f0f1f5', cursor: 'pointer', background: expanded === row.id ? '#f9fafb' : 'transparent', transition: 'background 0.1s' }}
                      onMouseEnter={e => { if (expanded !== row.id) e.currentTarget.style.background = '#f9fafb'; }}
                      onMouseLeave={e => { if (expanded !== row.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '10px 16px', color: '#9094a8', width: '32px' }}>
                        <span style={{ fontSize: '10px', display: 'inline-block', transition: 'transform 0.15s', transform: expanded === row.id ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                      </td>
                      <td style={{ padding: '10px 16px', color: '#1a1d2e', fontWeight: '500', maxWidth: '260px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.companies || '—'}</div>
                      </td>
                      <td style={{ padding: '10px 16px', color: '#1a1d2e' }}>{row.organization || '—'}</td>
                      <td style={{ padding: '10px 16px', color: '#9094a8' }}>{row.school || '—'}</td>
                      <td style={{ padding: '10px 16px' }} onClick={e => e.stopPropagation()}>
                        {row.atm
                          ? <span style={{ fontSize: '11px', color: '#00c896', fontWeight: '600', background: '#e8faf5', padding: '3px 10px', borderRadius: '20px' }}>✓ Added</span>
                          : <button onClick={() => handleAtm(row)} disabled={saving[row.id] === 'atm'}
                              style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', fontWeight: '600', color: '#1a1d2e', cursor: 'pointer', transition: 'border-color 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = '#00c896'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = '#e8eaf0'}
                            >{saving[row.id] === 'atm' ? 'Adding...' : '+ Add'}</button>
                        }
                      </td>
                    </tr>
                    {expanded === row.id && (
                      <tr style={{ borderBottom: '1px solid #f0f1f5' }}>
                        <td colSpan={5} style={{ padding: '0 16px 16px 48px', background: '#f9fafb' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '10px', color: '#9094a8', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>Organization</div>
                              <input value={editOrg} onChange={e => handleOrgChange(e.target.value, row.school)}
                                style={{ width: '100%', height: '34px', background: '#fff', border: '1px solid #00c896', borderRadius: '6px', padding: '0 10px', fontSize: '12px', color: '#1a1d2e', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '10px', color: '#9094a8', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>Company</div>
                              <input value={editCompany} onChange={e => setEditCompany(e.target.value)}
                                style={{ width: '100%', height: '34px', background: '#fff', border: '1px solid #e8eaf0', borderRadius: '6px', padding: '0 10px', fontSize: '12px', color: '#1a1d2e', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <button onClick={() => handleSave(row)} disabled={saving[row.id] === 'saving'}
                              style={{ height: '34px', padding: '0 16px', background: saving[row.id] === 'saved' ? '#e8faf5' : '#00c896', color: saving[row.id] === 'saved' ? '#00c896' : '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}>
                              {saving[row.id] === 'saving' ? 'Saving...' : saving[row.id] === 'saved' ? '✓ Added!' : 'Save & Add'}
                            </button>
                            <button onClick={() => setExpanded(null)}
                              style={{ height: '34px', padding: '0 12px', background: '#fff', color: '#9094a8', border: '1px solid #e8eaf0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}>
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
