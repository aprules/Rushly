import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const EXTENSION_ID = 'fdmnjnbkbknbphichknjepbmglmbckgm'; // replace with your actual extension ID

export default function Scraper() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([{ name: '', url: '' }]);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ scraped: 0, emails: 0, phones: 0, matched: 0 });
  const [schoolLogs, setSchoolLogs] = useState({});

  const addSchool = () => {
    if (schools.length < 5) setSchools([...schools, { name: '', url: '' }]);
  };

  const removeSchool = (i) => {
    setSchools(schools.filter((_, idx) => idx !== i));
  };

  const updateSchool = (i, field, value) => {
    const updated = [...schools];
    updated[i][field] = value;
    setSchools(updated);
  };

  const addLog = (text, type = 'info') => {
    setLogs(prev => [...prev, { text, type, time: new Date().toLocaleTimeString() }]);
  };

  const handleStart = async () => {
    for (const s of schools) {
      if (!s.name || !s.url) { alert('Please fill in all school fields'); return; }
    }

    setRunning(true);
    setLogs([]);
    setStats({ scraped: 0, emails: 0, phones: 0, matched: 0 });
    setSchoolLogs({});

    // Check extension
    if (!window.chrome?.runtime) {
      addLog('Chrome extension not detected. Please install the Rushly Scraper extension.', 'error');
      setRunning(false);
      return;
    }

    addLog('Connected to scraper extension.', 'success');
    addLog('Starting scrape...', 'info');

    // Listen for progress messages from extension
    const messageListener = (event) => {
      const msg = event.data;
      if (!msg || msg.source !== 'rushly-scraper') return;

      if (msg.action === 'progress') {
        if (msg.text) addLog(msg.text, 'info');
        if (msg.stats) setStats(msg.stats);
        if (msg.schoolLog) {
          setSchoolLogs(prev => ({ ...prev, [msg.schoolLog.name]: msg.schoolLog }));
        }
      }
      if (msg.action === 'done') {
        addLog('✓ ' + (msg.text || 'All done!'), 'success');
        if (msg.stats) setStats(msg.stats);
        setRunning(false);
        window.removeEventListener('message', messageListener);
      }
      if (msg.action === 'error') {
        addLog('⚠ ' + (msg.text || 'An error occurred.'), 'error');
        setRunning(false);
        window.removeEventListener('message', messageListener);
      }
    };
    window.addEventListener('message', messageListener);

    // Send to extension
    try {
      chrome.runtime.sendMessage(EXTENSION_ID, {
        action: 'startScrape',
        schools: schools.map(s => ({ schoolName: s.name, campusUrl: s.url })),
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_KEY
      });
    } catch(e) {
      addLog('Could not reach extension: ' + e.message, 'error');
      setRunning(false);
    }
  };

  return (
    <div style={{minHeight:'100vh',background:'#0f1117',fontFamily:'Segoe UI,sans-serif'}}>
      <div style={{background:'#161921',borderBottom:'1px solid #1e2130',padding:'14px 24px',display:'flex',alignItems:'center',gap:'12px'}}>
        <button onClick={() => navigate('/dashboard')} style={{background:'none',border:'none',color:'#555',cursor:'pointer',fontSize:'13px'}}>← Back</button>
        <div style={{fontSize:'14px',fontWeight:'600',color:'#fff'}}>CampusLabs Scraper</div>
      </div>

      <div style={{maxWidth:'720px',margin:'0 auto',padding:'32px 24px'}}>

        {/* Schools */}
        <div style={{background:'#161921',border:'1px solid #1e2130',borderRadius:'12px',padding:'24px',marginBottom:'16px'}}>
          <div style={{fontSize:'13px',fontWeight:'600',color:'#fff',marginBottom:'16px'}}>Schools</div>
          {schools.map((s, i) => (
            <div key={i} style={{marginBottom:'14px',padding:'14px',background:'#0f1117',borderRadius:'8px',border:'1px solid #1e2130'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                <div style={{fontSize:'11px',color:'#00c896',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.4px'}}>School {i + 1}</div>
                {schools.length > 1 && <button onClick={() => removeSchool(i)} style={{background:'none',border:'none',color:'#ff6b6b',cursor:'pointer',fontSize:'12px'}}>Remove</button>}
              </div>
              <div style={{marginBottom:'8px'}}>
                <div style={{fontSize:'10px',color:'#555',textTransform:'uppercase',letterSpacing:'0.3px',marginBottom:'4px'}}>School Name</div>
                <input value={s.name} onChange={e => updateSchool(i, 'name', e.target.value)} placeholder="e.g. University of Michigan" style={{width:'100%',height:'34px',background:'#161921',border:'1px solid #1e2130',borderRadius:'6px',padding:'0 10px',fontSize:'12px',color:'#ccc',outline:'none',boxSizing:'border-box'}} />
              </div>
              <div>
                <div style={{fontSize:'10px',color:'#555',textTransform:'uppercase',letterSpacing:'0.3px',marginBottom:'4px'}}>CampusLabs URL</div>
                <input value={s.url} onChange={e => updateSchool(i, 'url', e.target.value)} placeholder="https://umich.campuslabs.com/engage" style={{width:'100%',height:'34px',background:'#161921',border:'1px solid #1e2130',borderRadius:'6px',padding:'0 10px',fontSize:'12px',color:'#ccc',outline:'none',boxSizing:'border-box'}} />
              </div>
            </div>
          ))}
          {schools.length < 5 && (
            <button onClick={addSchool} style={{width:'100%',height:'34px',background:'none',border:'1px dashed #1e2130',borderRadius:'6px',fontSize:'12px',color:'#555',cursor:'pointer'}}>+ Add another school</button>
          )}
        </div>

        {/* Start Button */}
        <button onClick={handleStart} disabled={running} style={{width:'100%',height:'42px',background:running ? '#1e2130' : '#00c896',color:running ? '#555' : '#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:running ? 'not-allowed' : 'pointer',marginBottom:'16px'}}>
          {running ? 'Scraping...' : '▶ Start Scraping'}
        </button>

        {/* Stats */}
        {(running || stats.scraped > 0) && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'16px'}}>
            {[['Scraped',stats.scraped],['Emails',stats.emails],['Phones',stats.phones],['Matched',stats.matched]].map(([l,v]) => (
              <div key={l} style={{background:'#161921',border:'1px solid #1e2130',borderRadius:'8px',padding:'12px',textAlign:'center'}}>
                <div style={{fontSize:'20px',fontWeight:'600',color:'#00c896'}}>{v}</div>
                <div style={{fontSize:'10px',color:'#555',textTransform:'uppercase',letterSpacing:'0.3px',marginTop:'2px'}}>{l}</div>
              </div>
            ))}
          </div>
        )}

        {/* School Logs */}
        {Object.keys(schoolLogs).length > 0 && (
          <div style={{background:'#161921',border:'1px solid #1e2130',borderRadius:'12px',padding:'16px',marginBottom:'16px'}}>
            {Object.entries(schoolLogs).map(([name, d]) => (
              <div key={name} style={{padding:'8px 0',borderBottom:'1px solid #1e2130'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',fontWeight:'600',color:'#ccc',marginBottom:'4px'}}>
                  <span>{name} {d.total ? `— ${d.total} orgs` : ''}</span>
                  {d.done ? <span style={{color:'#00c896'}}>✓ {d.time}</span> : <span style={{color:'#555'}}>running...</span>}
                </div>
                <div style={{display:'flex',gap:'12px',fontSize:'11px',color:'#555'}}>
                  <span><b style={{color:'#00c896'}}>{d.orgs}</b> scraped</span>
                  <span><b style={{color:'#00c896'}}>{d.emails}</b> emails</span>
                  <span><b style={{color:'#00c896'}}>{d.phones}</b> phones</span>
                  <span><b style={{color:'#00c896'}}>{d.matched}</b> matched</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Log */}
        {logs.length > 0 && (
          <div style={{background:'#161921',border:'1px solid #1e2130',borderRadius:'12px',padding:'16px'}}>
            <div style={{fontSize:'11px',fontWeight:'600',color:'#555',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'12px'}}>Log</div>
            <div style={{maxHeight:'200px',overflowY:'auto'}}>
              {logs.map((l, i) => (
                <div key={i} style={{fontSize:'12px',color: l.type==='success'?'#00c896':l.type==='error'?'#ff6b6b':l.type==='warning'?'#f0c040':'#555',padding:'4px 0',borderBottom:'1px solid #1e2130'}}>
                  <span style={{color:'#333',marginRight:'8px'}}>{l.time}</span>{l.text}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}