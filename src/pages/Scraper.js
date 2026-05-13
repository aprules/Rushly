/* global chrome */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import Sidebar, { 175px } from '../components/Sidebar';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const EXTENSION_ID = 'ikegichhgohflbleliekfakapchldaop';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

// ─── DECOGRO ANIMATION ───
function DecogroAnimation({ running }) {
  const letters = ['D','E','C','O','G','R','O'];
  const [opacities, setOpacities] = useState(letters.map(() => 0));
  const activeRef = useRef(false);

  const runLoop = useCallback(async () => {
    while (activeRef.current) {
      for (let i = 0; i < 7; i++) {
        if (!activeRef.current) break;
        await new Promise(r => setTimeout(r, 80));
        setOpacities(prev => { const n = [...prev]; n[i] = 1; return n; });
        await new Promise(r => setTimeout(r, 300));
      }
      if (!activeRef.current) break;
      await new Promise(r => setTimeout(r, 500));
      setOpacities([0,0,0,0,0,0,0]);
      await new Promise(r => setTimeout(r, 400));
    }
    setOpacities([0,0,0,0,0,0,0]);
  }, []);

  useEffect(() => {
    if (running) { activeRef.current = true; runLoop(); }
    else { activeRef.current = false; }
    return () => { activeRef.current = false; };
  }, [running, runLoop]);

  if (!running) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '12px 0' }}>
      {letters.map((l, i) => (
        <span key={i} style={{ fontSize: '20px', fontWeight: '700', color: '#00c896', opacity: opacities[i], transition: 'opacity 300ms ease', letterSpacing: '3px' }}>{l}</span>
      ))}
    </div>
  );
}

export default function Scraper({ session }) {
  const navigate = useNavigate();
  const [schoolCount, setSchoolCount] = useState(1);
  const [schools, setSchools] = useState([
    { id: null, name: '', url: '' }, { id: null, name: '', url: '' }, { id: null, name: '', url: '' },
    { id: null, name: '', url: '' }, { id: null, name: '', url: '' }
  ]);
  const [availableSchools, setAvailableSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ scraped: 0, emails: 0, phones: 0, matched: 0 });
  const [schoolLogs, setSchoolLogs] = useState({});
  const pollRef = useRef(null);
  const sessionIdRef = useRef('');
  const activeSchoolsCountRef = useRef(0);
  const lastActivityRef = useRef(Date.now());

  // Load pending/in_progress schools with URLs from Supabase
  useEffect(() => {
    const load = async () => {
      setLoadingSchools(true);
      const { data } = await supabase
        .from('schools')
        .select('id, name, campuslabs_url, status')
        .in('status', ['pending', 'in_progress'])
        .not('campuslabs_url', 'is', null)
        .neq('campuslabs_url', '')
        .order('name', { ascending: true });
      setAvailableSchools(data || []);
      setLoadingSchools(false);
    };
    load();
  }, []);

  const selectSchool = (i, schoolId) => {
    const found = availableSchools.find(s => s.id === parseInt(schoolId));
    setSchools(prev => {
      const n = [...prev];
      n[i] = found ? { id: found.id, name: found.name, url: found.campuslabs_url } : { id: null, name: '', url: '' };
      return n;
    });
  };

  const handleClear = () => {
    setSchools([{ id: null, name: '', url: '' }, { id: null, name: '', url: '' }, { id: null, name: '', url: '' }, { id: null, name: '', url: '' }, { id: null, name: '', url: '' }]);
    setStats({ scraped: 0, emails: 0, phones: 0, matched: 0 });
    setSchoolLogs({});
    setStatus('');
    setProgress(0);
    setDone(false);
    setSchoolCount(1);
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const finishScrape = useCallback(async (completedSchools) => {
    stopPolling();
    // Mark completed schools as done in Supabase
    if (completedSchools && completedSchools.length > 0) {
      const ids = completedSchools.map(s => s.id).filter(Boolean);
      if (ids.length > 0) {
        await supabase.from('schools').update({ status: 'done' }).in('id', ids);
        // Refresh available schools list
        const { data } = await supabase
          .from('schools')
          .select('id, name, campuslabs_url, status')
          .in('status', ['pending', 'in_progress'])
          .not('campuslabs_url', 'is', null)
          .neq('campuslabs_url', '')
          .order('name', { ascending: true });
        setAvailableSchools(data || []);
      }
    }
    setRunning(false);
    setDone(true);
    setProgress(100);
    setTimeout(() => {
      setDone(false);
      setStatus('');
      setProgress(0);
      setSchoolCount(1);
      setSchools([{ id: null, name: '', url: '' }, { id: null, name: '', url: '' }, { id: null, name: '', url: '' }, { id: null, name: '', url: '' }, { id: null, name: '', url: '' }]);
    }, 5000);
  }, []);

  const startPolling = useCallback((sessionId, activeSchools) => {
    stopPolling();
    lastActivityRef.current = Date.now();
    pollRef.current = setInterval(async () => {
      if (Date.now() - lastActivityRef.current > 90000) { finishScrape(activeSchools); return; }
      try {
        const { data } = await supabase.from('scrape_progress').select('*').eq('session_id', sessionId);
        if (!data || data.length === 0) return;

        let totalScraped = 0, totalEmails = 0, totalPhones = 0, totalMatched = 0;
        const logs = {};
        let currentStatus = '';
        let currentPct = 0;

        const latest = {};
        for (const row of data) {
          if (!latest[row.school_name] || row.id > latest[row.school_name].id) latest[row.school_name] = row;
        }

        for (const row of Object.values(latest)) {
          if (row.school_name === '__status__') { currentStatus = row.status || ''; currentPct = row.pct || 0; continue; }
          totalScraped += row.scraped || 0;
          totalEmails  += row.emails  || 0;
          totalPhones  += row.phones  || 0;
          totalMatched += row.matched || 0;
          logs[row.school_name] = { orgs: row.scraped, total: row.total_orgs, emails: row.emails, phones: row.phones, matched: row.matched, time: row.time_taken || '', done: row.done };
          if (!currentStatus && row.status && !row.done) { currentStatus = row.status; currentPct = row.pct || 0; }
        }

        if (currentStatus) setStatus(currentStatus);
        if (currentPct) setProgress(currentPct);

        if (totalScraped > 0) {
          setStats(prev => ({
            scraped: Math.max(prev.scraped, totalScraped), emails: Math.max(prev.emails, totalEmails),
            phones:  Math.max(prev.phones,  totalPhones),  matched: Math.max(prev.matched, totalMatched),
          }));
        }

        setSchoolLogs(prev => {
          const merged = { ...prev };
          for (const [name, entry] of Object.entries(logs)) {
            if (!merged[name] || entry.done || (entry.orgs || 0) >= (merged[name].orgs || 0)) merged[name] = entry;
          }
          return merged;
        });

        lastActivityRef.current = Date.now();

        const schoolLatest = Object.values(latest).filter(r => r.school_name !== '__status__');
        const expectedSchools = activeSchoolsCountRef.current || 1;
        const allDone = schoolLatest.length >= expectedSchools && schoolLatest.every(r => r.done);
        if (allDone) finishScrape(activeSchools);
      } catch(e) {}
    }, 1000);
  }, [finishScrape]);

  const handleStart = async () => {
    const activeSchools = schools.slice(0, schoolCount).filter(s => s.name && s.url);
    if (activeSchools.length === 0) { alert('Please select at least one school.'); return; }
    if (activeSchools.length < schoolCount) { alert('Please select all school slots.'); return; }

    if (!window.chrome || !window.chrome.runtime) {
      setStatus('Extension not detected. Please install the Rushly Scraper extension.');
      return;
    }

    // Mark selected schools as in_progress
    const ids = activeSchools.map(s => s.id).filter(Boolean);
    if (ids.length > 0) await supabase.from('schools').update({ status: 'in_progress' }).in('id', ids);

    const sessionId = Date.now().toString();
    sessionIdRef.current = sessionId;
    activeSchoolsCountRef.current = activeSchools.length;

    setRunning(true);
    setDone(false);
    setStatus('Starting...');
    setProgress(0);
    setStats({ scraped: 0, emails: 0, phones: 0, matched: 0 });
    setSchoolLogs({});

    startPolling(sessionId, activeSchools);

    const maxTimeout = setTimeout(() => {
      stopPolling();
      setRunning(false);
      setDone(true);
      setStatus('Scrape completed.');
      setProgress(100);
    }, 30 * 60 * 1000);

    try {
      chrome.runtime.sendMessage(EXTENSION_ID, {
        action: 'startScrape', sessionId,
        schools: activeSchools.map(s => ({ schoolName: s.name, campusUrl: s.url })),
        supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_KEY
      }, (response) => {
        if (chrome.runtime.lastError) {
          stopPolling(); clearTimeout(maxTimeout);
          setStatus('Could not reach extension: ' + chrome.runtime.lastError.message);
          setRunning(false);
        }
      });
    } catch(e) {
      stopPolling(); clearTimeout(maxTimeout);
      setStatus('Could not reach extension: ' + e.message);
      setRunning(false);
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  // Get already-selected school IDs to avoid duplicates in dropdowns
  const selectedIds = schools.slice(0, schoolCount).map(s => s.id).filter(Boolean);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', Segoe UI, sans-serif", background: '#f5f6fa' }}>

      {/* Sidebar */}
      <div style={{ width: '200px', minHeight: '100vh', background: '#2d3561', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10 }}>
        <div style={{ padding: '20px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '7px', cursor: 'pointer', color: item.path === '/scraper' ? '#fff' : 'rgba(255,255,255,0.65)', background: item.path === '/scraper' ? 'rgba(255,255,255,0.1)' : 'transparent', fontSize: '13px', fontWeight: '500', marginBottom: '2px', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (item.path !== '/scraper') { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}}
                  onMouseLeave={e => { if (item.path !== '/scraper') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}}
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

      {/* Main content */}
      <div style={{ marginLeft: '175px', flex: 1, display: 'flex', minHeight: '100vh' }}>

        {/* LEFT COLUMN */}
        <div style={{ width: '400px', flexShrink: 0, padding: '28px 24px', borderRight: '1px solid #e8eaf0', background: '#f5f6fa', overflowY: 'auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#1a1d2e', letterSpacing: '-0.3px' }}>CampusLabs Scraper</div>
              <div style={{ fontSize: '12px', color: '#9094a8', marginTop: '2px' }}>
                {loadingSchools ? 'Loading schools...' : `${availableSchools.length} schools pending`}
              </div>
            </div>
            <button onClick={handleClear} style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '7px', padding: '5px 12px', fontSize: '11px', color: '#e05c5c', cursor: 'pointer', fontWeight: '500' }}>✕ Clear</button>
          </div>

          {/* School count */}
          <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: '#9094a8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>How many schools?</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setSchoolCount(n)} style={{
                  flex: 1, height: '34px', border: '1px solid',
                  borderColor: schoolCount === n ? '#00c896' : '#e8eaf0',
                  borderRadius: '7px',
                  background: schoolCount === n ? '#00c896' : '#fff',
                  color: schoolCount === n ? '#fff' : '#9094a8',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s'
                }}>{n}</button>
              ))}
            </div>
          </div>

          {/* School dropdowns */}
          {Array.from({ length: schoolCount }, (_, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '10px', padding: '14px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                <div style={{ width: '20px', height: '20px', background: '#00c896', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#fff' }}>{i + 1}</div>
                <span style={{ fontSize: '10px', color: '#9094a8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>School {i + 1}</span>
              </div>
              <select
                value={schools[i].id || ''}
                onChange={e => selectSchool(i, e.target.value)}
                disabled={loadingSchools || running}
                style={{ width: '100%', height: '34px', background: '#f5f6fa', border: '1px solid #e8eaf0', borderRadius: '6px', padding: '0 10px', fontSize: '12px', color: schools[i].id ? '#1a1d2e' : '#9094a8', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="">
                  {loadingSchools ? 'Loading...' : '— Select a school —'}
                </option>
                {availableSchools
                  .filter(s => s.id === schools[i].id || !selectedIds.includes(s.id))
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.status === 'in_progress' ? ' ⏳' : ''}
                    </option>
                  ))
                }
              </select>
              {schools[i].url && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#9094a8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  🔗 {schools[i].url}
                </div>
              )}
            </div>
          ))}

          {/* Start button */}
          {!running && !done && (
            <button onClick={handleStart} style={{
              width: '100%', height: '42px', background: '#00c896', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', marginTop: '4px', marginBottom: '14px',
              boxShadow: '0 4px 14px rgba(0,200,150,0.3)', transition: 'opacity 0.15s'
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >▶ Start scraping</button>
          )}

          {done && (
            <div style={{ width: '100%', height: '42px', background: '#e8faf5', color: '#00c896', border: '1px solid #b3eed9', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px', marginBottom: '14px' }}>
              ✓ Done — scrape another school
            </div>
          )}

          {/* Stats */}
          {stats.scraped > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
              {[['SCRAPED', stats.scraped], ['EMAILS', stats.emails], ['PHONES', stats.phones], ['MATCHED', stats.matched]].map(([l, v]) => (
                <div key={l} style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '8px', padding: '10px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#00c896', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: '9px', color: '#9094a8', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '4px' }}>{l}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {running && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '10px', marginBottom: '10px' }}>
                <DecogroAnimation running={running} />
              </div>
              <div style={{ height: '3px', background: '#e8eaf0', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ height: '100%', background: '#00c896', width: progress + '%', transition: 'width 0.5s ease', borderRadius: '2px' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#9094a8' }}>{status}</div>
            </div>
          )}

          {Object.entries(schoolLogs).map(([name, d]) => (
            <div key={name}>
              <div style={{ padding: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1d2e' }}>{name}{d.total ? ` — ${d.total} orgs` : ''}</span>
                    {!d.done && d.orgs > 0 && d.total > 0 && (
                      <span style={{ fontSize: '11px', color: '#9094a8', marginLeft: '8px' }}>{d.orgs}/{d.total} scraped</span>
                    )}
                  </div>
                  {d.done
                    ? <span style={{ fontSize: '11px', color: '#00c896', fontWeight: '600', background: '#e8faf5', padding: '2px 10px', borderRadius: '20px', flexShrink: 0 }}>✓ {d.time}</span>
                    : <span style={{ fontSize: '11px', color: '#f59e0b', background: '#fffbeb', padding: '2px 10px', borderRadius: '20px', flexShrink: 0 }}>⏳ running...</span>
                  }
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9094a8' }}>
                  <span><b style={{ color: '#1a1d2e' }}>{d.orgs}</b> scraped</span>
                  <span><b style={{ color: '#1a1d2e' }}>{d.emails}</b> emails</span>
                  <span><b style={{ color: '#1a1d2e' }}>{d.phones}</b> phones</span>
                  <span><b style={{ color: '#1a1d2e' }}>{d.matched}</b> matched</span>
                </div>
              </div>
              <div style={{ height: '1px', background: '#e8eaf0' }} />
            </div>
          ))}

          {Object.keys(schoolLogs).length === 0 && !running && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#c5c7d4' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e8eaf0" strokeWidth="1.5" style={{ marginBottom: '12px' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <div style={{ fontSize: '13px' }}>Results will appear here when scraping starts</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
