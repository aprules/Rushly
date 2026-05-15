import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../supabaseClient';

export default function ScrapeHistory({ session }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('scrape_progress')
      .select('*')
      .eq('done', true)
      .neq('school_name', '__status__')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLogs(data || []);
        setLoading(false);
      });
  }, []);

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
      dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', Segoe UI, sans-serif", background: '#f5f6fa' }}>
      <Sidebar session={session} />
      <div style={{ marginLeft: '175px', flex: 1, padding: '32px', minWidth: 0 }}>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1d2e', letterSpacing: '-0.3px' }}>Scrape History</div>
          <div style={{ fontSize: '13px', color: '#9094a8', marginTop: '2px' }}>Log of all past scraping activity</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f5f6fa', borderBottom: '1px solid #e8eaf0' }}>
                  {['Date', 'School', 'Orgs Scraped', 'Scrape Duration'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#1a1d2e', fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#9094a8' }}>Loading...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#9094a8' }}>No scrape history yet. Run a scrape to get started.</td></tr>
                ) : logs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f1f5' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 16px', color: '#9094a8', whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</td>
                    <td style={{ padding: '10px 16px', color: '#1a1d2e', fontWeight: '500' }}>{log.school_name || '—'}</td>
                    <td style={{ padding: '10px 16px', color: '#1a1d2e' }}>{log.scraped != null ? `${log.scraped} orgs` : '—'}</td>
                    <td style={{ padding: '10px 16px', color: '#00c896', fontWeight: '600', whiteSpace: 'nowrap' }}>{log.time_taken || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
