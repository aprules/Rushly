import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../supabaseClient';

export default function Review({ session }) {
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


  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', Segoe UI, sans-serif", background: '#f5f6fa' }} className='rly-main'>
      <Sidebar session={session} />

      <div style={{ marginLeft: '175px', flex: 1, padding: '32px', minWidth: 0 }}>
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

        <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px', overflow: 'hidden' }} className='rly-card rly-border'>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f5f6fa', borderBottom: '1px solid #e8eaf0' }} className='rly-thead rly-border'>
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
