/* global chrome */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const EXTENSION_ID = 'fdmnjnbkbknbphichknjepbmglmbckgm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const NAV_ITEMS = [
  { label: 'Scraper', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
  ), path: '/scraper' },
  { label: 'Leads', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ), path: '/leads' },
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
    if (running) {
      activeRef.current = true;
      runLoop();
    } else {
      activeRef.current = false;
    }
    return () => { activeRef.current = false; };
  }, [running, runLoop]);

  if (!running) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '14px 0' }}>
      {letters.map((l, i) => (
        <span key={i} style={{
          fontSize: '20px', fontWeight: '700', color: '#00c896',
          opacity: opacities[i], transition: 'opacity 300ms ease', letterSpacing: '3px'
        }}>{l}</span>
      ))}
    </div>
  );
}

export default function Scraper({ session }) {
  const navigate = useNavigate();
  const [schoolCount, setSchoolCount] = useState(1);
  const [schools, setSchools] = useState([
    { name: '', url: '' }, { name: '', url: '' }, { name: '', url: '' },
    { name: '', url: '' }, { name: '', url: '' }
  ]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ scraped: 0, emails: 0, phones: 0, matched: 0 });
  const [schoolLogs, setSchoolLogs] = useState({});
  const pollRef = useRef(null);
  const sessionIdRef = useRef('');

  useEffect(() => {
    const saved = localStorage.getItem('rushly_schools');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSchools(prev => prev.map((s, i) => parsed[i] || s));
        const count = parsed.filter(s => s.name || s.url).length;
        if (count > 0) setSchoolCount(count);
      } catch(e) {}
    }
  }, []);

  const updateSchool = (i, field, value) => {
    setSchools(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: value }; return n; });
  };

  const handleClear = () => {
    setSchools([{ name: '', url: '' }, { name: '', url: '' }, { name: '', url: '' }, { name: '', url: '' }, { name: '', url: '' }]);
    setStats({ scraped: 0, emails: 0, phones: 0, matched: 0 });
    setSchoolLogs({});
    setStatus('');
    setProgress(0);
    setDone(false);
    localStorage.removeItem('rushly_schools');
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = (sessionId) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('scrape_progress')
          .select('*')
          .eq('session_id', sessionId);

        if (!data || data.length === 0) return;

        let totalScraped = 0, totalEmails = 0, totalPhones = 0, totalMatched = 0;
        const logs = {};

        for (const row of data) {
          totalScraped += row.scraped || 0;
          totalEmails  += row.emails  || 0;
          totalPhones  += row.phones  || 0;
          totalMatched += row.matched || 0;
          logs[row.school_name] = {
            orgs:    row.scraped,
            total:   row.total_orgs,
            emails:  row.emails,
            phones:  row.phones,
            matched: row.matched,
            time:    row.time_taken || '',
            done:    row.done
          };
          if (row.status) setStatus(row.status);
          if (row.pct)    setProgress(row.pct);
        }

        setStats({ scraped: totalScraped, emails: totalEmails, phones: totalPhones, matched: totalMatched });
        setSchoolLogs(logs);

        const activeSchools = schools.slice(0, schoolCount).filter(s => s.name && s.url);
        const allDone = data.every(r => r.done);
        if (allDone && data.length === activeSchools.length) {
          stopPolling();
          setRunning(false);
          setDone(true);
          setProgress(100);
          setTimeout(() => { setDone(false); setStatus(''); setProgress(0); }, 5000);
        }
      } catch(e) {}
    }, 1000);
  };

  const handleStart = async () => {
    const activeSchools = schools.slice(0, schoolCount).filter(s => s.name && s.url);
    if (activeSchools.length === 0) { alert('Please fill in at least one school.'); return; }
    if (activeSchools.length < schoolCount) { alert('Please fill in all school fields.'); return; }

    if (!window.chrome || !window.chrome.runtime) {
      setStatus('Extension not detected. Please install the Rushly Scraper extension.');
      return;
    }

    localStorage.setItem('rushly_schools', JSON.stringify(schools));

    const sessionId = Date.now().toString();
    sessionIdRef.current = sessionId;

    setRunning(true);
    setDone(false);
    setStatus('Starting...');
    setProgress(0);
    setStats({ scraped: 0, emails: 0, phones: 0, matched: 0 });
    setSchoolLogs({});

    startPolling(sessionId);

    const maxTimeout = setTimeout(() => {
      stopPolling();
      setRunning(false);
      setDone(true);
      setStatus('Scrape completed.');
      setProgress(100);
    }, 30 * 60 * 1000);

    try {
      chrome.runtime.sendMessage(EXTENSION_ID, {
        action: 'startScrape',
        sessionId,
        schools: activeSchools.map(s => ({ schoolName: s.name, campusUrl: s.url })),
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_KEY
      }, (response) => {
        if (chrome.runtime.lastError) {
          stopPolling();
          clearTimeout(maxTimeout);
          setStatus('Could not reach extension: ' + chrome.runtime.lastError.message);
          setRunning(false);
        }
      });
    } catch(e) {
      stopPolling();
      clearTimeout(maxTimeout);
      setStatus('Could not reach extension: ' + e.message);
      setRunning(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', Segoe UI, sans-serif", background: '#f5f6fa' }}>

      {/* Sidebar */}
      <div style={{
        width: '200px', minHeight: '100vh', background: '#2d3561',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10
      }}>
        <div style={{ padding: '20px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', background: '#00c896',
              borderRadius: '8px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#fff'
            }}>R</div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '-0.2px' }}>Rushly</span>
          </div>
        </div>

        <div style={{ padding: '12px 8px', flex: 1 }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '8px 8px 6px' }}>Menu</div>
          {NAV_ITEMS.map(item => (
            <div key={item.path} onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 10px', borderRadius: '7px', cursor: 'pointer',
                color: item.path === '/scraper' ? '#fff' : 'rgba(255,255,255,0.65)',
                background: item.path === '/scraper' ? 'rgba(255,255,255,0.1)' : 'transparent',
                fontSize: '13px', fontWeight: '500', marginBottom: '2px',
                transition: 'background 0.15s, color 0.15s'
              }}
              onMouseEnter={e => { if (item.path !== '/scraper') { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}}
              onMouseLeave={e => { if (item.path !== '/scraper') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session?.user?.email || ''}
          </div>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px',
            padding: '6px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', width: '100%', textAlign: 'left'
          }}>Sign out</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: '200px', flex: 1, padding: '32px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1d2e', letterSpacing: '-0.3px' }}>CampusLabs Scraper</div>
            <div style={{ fontSize: '13px', color: '#9094a8', marginTop: '2px' }}>Scrape org contact info from CampusLabs directories</div>
          </div>
          <button onClick={handleClear} style={{
            background: '#fff', border: '1px solid #e8eaf0', borderRadius: '7px',
            padding: '7px 14px', fontSize: '12px', color: '#e05c5c',
            cursor: 'pointer', fontWeight: '500'
          }}>✕ Clear</button>
        </div>

        <div style={{ maxWidth: '560px' }}>

          {/* School count */}
          <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#9094a8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>How many schools?</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setSchoolCount(n)} style={{
                  flex: 1, height: '36px', border: '1px solid',
                  borderColor: schoolCount === n ? '#00c896' : '#e8eaf0',
                  borderRadius: '7px',
                  background: schoolCount === n ? '#00c896' : '#fff',
                  color: schoolCount === n ? '#fff' : '#9094a8',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  transition: 'all 0.15s'
                }}>{n}</button>
              ))}
            </div>
          </div>

          {/* School fields */}
          {Array.from({ length: schoolCount }, (_, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px', padding: '16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
                <div style={{
                  width: '22px', height: '22px', background: '#00c896', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '700', color: '#fff'
                }}>{i + 1}</div>
                <span style={{ fontSize: '11px', color: '#9094a8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>School {i + 1}</span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#9094a8', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '5px' }}>School name</div>
                <input
                  value={schools[i].name}
                  onChange={e => updateSchool(i, 'name', e.target.value)}
                  placeholder="e.g. Lehigh University"
                  style={{
                    width: '100%', height: '36px', background: '#f5f6fa',
                    border: '1px solid #e8eaf0', borderRadius: '7px',
                    padding: '0 12px', fontSize: '13px', color: '#1a1d2e',
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#9094a8', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '5px' }}>CampusLabs URL</div>
                <input
                  value={schools[i].url}
                  onChange={e => updateSchool(i, 'url', e.target.value)}
                  placeholder="https://lehigh.campuslabs.com/engage"
                  style={{
                    width: '100%', height: '36px', background: '#f5f6fa',
                    border: '1px solid #e8eaf0', borderRadius: '7px',
                    padding: '0 12px', fontSize: '13px', color: '#1a1d2e',
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          ))}

          {/* Action button */}
          {!running && !done && (
            <button onClick={handleStart} style={{
              width: '100%', height: '44px', background: '#00c896', color: '#fff',
              border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', marginBottom: '16px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 4px 14px rgba(0,200,150,0.3)', transition: 'opacity 0.15s'
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              ▶ Start scraping
            </button>
          )}

          {running && (
            <div style={{
              width: '100%', background: '#fff', border: '1px solid #e8eaf0',
              borderRadius: '9px', marginBottom: '16px'
            }}>
              <DecogroAnimation running={running} />
            </div>
          )}

          {done && (
            <div style={{
              width: '100%', height: '44px', background: '#e8faf5', color: '#00c896',
              border: '1px solid #b3eed9', borderRadius: '9px', fontSize: '13px',
              fontWeight: '600', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '16px'
            }}>
              ✓ Done — scrape another school
            </div>
          )}

          {/* Progress bar */}
          {(running || done) && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ height: '4px', background: '#e8eaf0', borderRadius: '2px', overflow: 'hidden', marginBottom: '7px' }}>
                <div style={{ height: '100%', background: '#00c896', width: progress + '%', transition: 'width 0.5s ease', borderRadius: '2px' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#9094a8' }}>{status}</div>
            </div>
          )}

          {/* Stats */}
          {(running || stats.scraped > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
              {[['SCRAPED', stats.scraped], ['EMAILS', stats.emails], ['PHONES', stats.phones], ['MATCHED', stats.matched]].map(([l, v]) => (
                <div key={l} style={{
                  background: '#fff', border: '1px solid #e8eaf0',
                  borderRadius: '10px', padding: '12px 8px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#00c896', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: '9px', color: '#9094a8', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '5px' }}>{l}</div>
                </div>
              ))}
            </div>
          )}

          {/* School logs */}
          {Object.keys(schoolLogs).length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px', overflow: 'hidden' }}>
              {Object.entries(schoolLogs).map(([name, d], i, arr) => (
                <div key={name} style={{
                  padding: '12px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid #e8eaf0' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1d2e' }}>
                      {name}{d.total ? ` — ${d.total} orgs` : ''}
                    </span>
                    {d.done
                      ? <span style={{ fontSize: '11px', color: '#00c896', fontWeight: '600', background: '#e8faf5', padding: '2px 8px', borderRadius: '20px' }}>
                          ✓ {d.time}
                        </span>
                      : <span style={{ fontSize: '11px', color: '#9094a8' }}>⏳ running...</span>
                    }
                  </div>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#9094a8' }}>
                    <span><b style={{ color: '#1a1d2e' }}>{d.orgs}</b> scraped</span>
                    <span><b style={{ color: '#1a1d2e' }}>{d.emails}</b> emails</span>
                    <span><b style={{ color: '#1a1d2e' }}>{d.phones}</b> phones</span>
                    <span><b style={{ color: '#1a1d2e' }}>{d.matched}</b> matched</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
