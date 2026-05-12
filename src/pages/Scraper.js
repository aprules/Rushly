/* global chrome */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const EXTENSION_ID = 'fdmnjnbkbknbphichknjepbmglmbckgm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'3px',padding:'14px 0'}}>
      {letters.map((l, i) => (
        <span key={i} style={{
          fontSize:'20px',fontWeight:'700',color:'#00c896',
          opacity: opacities[i],transition:'opacity 300ms ease',letterSpacing:'3px'
        }}>{l}</span>
      ))}
    </div>
  );
}

export default function Scraper() {
  const navigate = useNavigate();
  const [schoolCount, setSchoolCount] = useState(1);
  const [schools, setSchools] = useState([
    {name:'',url:''},{name:'',url:''},{name:'',url:''},
    {name:'',url:''},{name:'',url:''}
  ]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ scraped: 0, emails: 0, phones: 0, matched: 0 });
  const [schoolLogs, setSchoolLogs] = useState({});
  const pollRef = useRef(null);
  const sessionIdRef = useRef('');

  // Load saved schools
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
    setSchools(prev => { const n = [...prev]; n[i] = {...n[i], [field]: value}; return n; });
  };

  const handleClear = () => {
    setSchools([{name:'',url:''},{name:'',url:''},{name:'',url:''},{name:'',url:''},{name:'',url:''}]);
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

        // Aggregate stats across all schools
        let totalScraped = 0, totalEmails = 0, totalPhones = 0, totalMatched = 0;
        const logs = {};

        for (const row of data) {
          totalScraped += row.scraped || 0;
          totalEmails  += row.emails  || 0;
          totalPhones  += row.phones  || 0;
          totalMatched += row.matched || 0;
          logs[row.school_name] = {
            orgs: row.scraped,
            total: row.total_orgs,
            emails: row.emails,
            phones: row.phones,
            matched: row.matched,
            time: '',
            done: row.done
          };
          if (row.status) setStatus(row.status);
          if (row.pct)    setProgress(row.pct);
        }

        setStats({ scraped: totalScraped, emails: totalEmails, phones: totalPhones, matched: totalMatched });
        setSchoolLogs(logs);

        // Check if all schools done
        const allDone = data.every(r => r.done);
        if (allDone && data.length === schools.slice(0, schoolCount).filter(s => s.name && s.url).length) {
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

  return (
    <div style={{minHeight:'100vh',background:'#0f1117',fontFamily:'Segoe UI,sans-serif'}}>

      {/* Header */}
      <div style={{background:'#161921',borderBottom:'1px solid #1e2130',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <button onClick={() => navigate('/dashboard')} style={{background:'none',border:'none',color:'#555',cursor:'pointer',fontSize:'13px'}}>← Back</button>
          <div style={{fontSize:'14px',fontWeight:'600',color:'#fff'}}>CampusLabs Scraper</div>
        </div>
        <button onClick={handleClear} style={{background:'none',border:'none',color:'#ff6b6b',cursor:'pointer',fontSize:'12px'}}>✕ Clear</button>
      </div>

      <div style={{maxWidth:'480px',margin:'0 auto',padding:'24px 16px'}}>

        {/* Count buttons */}
        <div style={{fontSize:'10px',color:'#555',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px'}}>How many schools?</div>
        <div style={{display:'flex',gap:'6px',marginBottom:'20px'}}>
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setSchoolCount(n)} style={{
              flex:1,height:'34px',border:'1px solid',
              borderColor: schoolCount===n ? '#00c896' : '#1e2130',
              borderRadius:'6px',
              background: schoolCount===n ? '#00c896' : '#161921',
              color: schoolCount===n ? '#fff' : '#555',
              fontSize:'13px',fontWeight:'600',cursor:'pointer'
            }}>{n}</button>
          ))}
        </div>

        {/* School fields */}
        {Array.from({length: schoolCount}, (_, i) => (
          <div key={i} style={{marginBottom:'12px',background:'#161921',border:'1px solid #1e2130',borderRadius:'10px',padding:'14px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'10px'}}>
              <div style={{width:'20px',height:'20px',background:'#00c896',borderRadius:'5px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',color:'#fff'}}>{i+1}</div>
              <span style={{fontSize:'11px',color:'#555',textTransform:'uppercase',letterSpacing:'0.4px'}}>School {i+1}</span>
            </div>
            <div style={{marginBottom:'8px'}}>
              <div style={{fontSize:'10px',color:'#444',textTransform:'uppercase',letterSpacing:'0.3px',marginBottom:'4px'}}>School name</div>
              <input value={schools[i].name} onChange={e => updateSchool(i, 'name', e.target.value)} placeholder="e.g. Lehigh University" style={{width:'100%',height:'32px',background:'#0f1117',border:'1px solid #1e2130',borderRadius:'6px',padding:'0 10px',fontSize:'12px',color:'#ccc',outline:'none',boxSizing:'border-box'}} />
            </div>
            <div>
              <div style={{fontSize:'10px',color:'#444',textTransform:'uppercase',letterSpacing:'0.3px',marginBottom:'4px'}}>CampusLabs URL</div>
              <input value={schools[i].url} onChange={e => updateSchool(i, 'url', e.target.value)} placeholder="https://lehigh.campuslabs.com/engage" style={{width:'100%',height:'32px',background:'#0f1117',border:'1px solid #1e2130',borderRadius:'6px',padding:'0 10px',fontSize:'12px',color:'#ccc',outline:'none',boxSizing:'border-box'}} />
            </div>
          </div>
        ))}

        {/* Buttons */}
        {!running && !done && (
          <button onClick={handleStart} style={{width:'100%',height:'42px',background:'#00c896',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:'pointer',marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
            ▶ Start scraping
          </button>
        )}

        {running && (
          <div style={{width:'100%',background:'#161921',border:'1px solid #1e2130',borderRadius:'8px',marginBottom:'16px'}}>
            <DecogroAnimation running={running} />
          </div>
        )}

        {done && (
          <div style={{width:'100%',height:'42px',background:'#1a2035',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'600',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px'}}>
            ✓ Done — scrape another school
          </div>
        )}

        {/* Progress bar */}
        {(running || done) && (
          <div style={{marginBottom:'14px'}}>
            <div style={{height:'3px',background:'#1e2130',borderRadius:'2px',overflow:'hidden',marginBottom:'6px'}}>
              <div style={{height:'100%',background:'#00c896',width: progress + '%',transition:'width 0.5s ease'}} />
            </div>
            <div style={{fontSize:'11px',color:'#555'}}>{status}</div>
          </div>
        )}

        {/* Stats */}
        {(running || stats.scraped > 0) && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'16px'}}>
            {[['SCRAPED',stats.scraped],['EMAILS',stats.emails],['PHONES',stats.phones],['MATCHED',stats.matched]].map(([l,v]) => (
              <div key={l} style={{background:'#161921',border:'1px solid #1e2130',borderRadius:'8px',padding:'10px 6px',textAlign:'center'}}>
                <div style={{fontSize:'20px',fontWeight:'600',color:'#00c896',lineHeight:1}}>{v}</div>
                <div style={{fontSize:'9px',color:'#444',textTransform:'uppercase',letterSpacing:'0.4px',marginTop:'4px'}}>{l}</div>
              </div>
            ))}
          </div>
        )}

        {/* School logs */}
        {Object.keys(schoolLogs).length > 0 && (
          <div style={{background:'#161921',border:'1px solid #1e2130',borderRadius:'10px',overflow:'hidden'}}>
            {Object.entries(schoolLogs).map(([name, d], i, arr) => (
              <div key={name} style={{padding:'10px 14px',borderBottom: i < arr.length-1 ? '1px solid #1e2130' : 'none'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'5px'}}>
                  <span style={{fontSize:'12px',fontWeight:'600',color:'#ccc'}}>{name}{d.total ? ` — ${d.total} orgs` : ''}</span>
                  {d.done
                    ? <span style={{fontSize:'10px',color:'#00c896',fontWeight:'500'}}>✓ {d.time}</span>
                    : <span style={{fontSize:'10px',color:'#555'}}>⏳ running...</span>
                  }
                </div>
                <div style={{display:'flex',gap:'10px',fontSize:'11px',color:'#444'}}>
                  <span><b style={{color:'#00c896'}}>{d.orgs}</b> scraped</span>
                  <span><b style={{color:'#00c896'}}>{d.emails}</b> emails</span>
                  <span><b style={{color:'#00c896'}}>{d.phones}</b> phones</span>
                  <span><b style={{color:'#00c896'}}>{d.matched}</b> matched</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}