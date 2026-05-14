import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../supabaseClient';

const TABS = [
  { key: 'overall', label: 'Overall Score' },
  { key: 'leads', label: 'Most Leads' },
  { key: 'phones', label: 'Most Phones' },
  { key: 'emails', label: 'Most Emails' },
];

function scoreSchool(data) {
  let score = 0;
  if (data.total >= 300) score += 40;
  if (data.phones >= 500) score += 30;
  if (data.emails >= 1000) score += 20;
  if (data.both >= 100) score += 10;
  return score;
}

function getColor(score) {
  if (score >= 70) return '#00c896';
  if (score >= 40) return '#f59e0b';
  return '#e05c5c';
}

function getBadgeStyle(score) {
  if (score >= 70) return { background: '#e8faf5', color: '#00875a' };
  if (score >= 40) return { background: '#fffbeb', color: '#b45309' };
  return { background: '#fef2f2', color: '#b91c1c' };
}

export default function Analytics({ session }) {
  const [tab, setTab] = useState('overall');
  const [loading, setLoading] = useState(true);
  const [schoolStats, setSchoolStats] = useState([]);
  const [summary, setSummary] = useState({ scored: 0, avg: 0, high: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase.from('leads').select('company, email_address, phone_number');
      if (!data) { setLoading(false); return; }

      // First pass: find all unique suffixes to identify school names
      // School names are typically 2-5 words at the end of the company field
      // We try suffix lengths 2-5 and pick the one that groups best
      const suffixCounts = {};
      data.forEach(r => {
        const parts = (r.company || '').trim().split(' ');
        for (let len = 2; len <= 5; len++) {
          if (parts.length > len) {
            const suffix = parts.slice(-len).join(' ');
            suffixCounts[suffix] = (suffixCounts[suffix] || 0) + 1;
          }
        }
      });
      // A valid school name appears 3+ times
      const validSchools = new Set(Object.entries(suffixCounts).filter(([, v]) => v >= 3).map(([k]) => k));

      const map = {};
      data.forEach(r => {
        const parts = (r.company || '').trim().split(' ');
        // Find the longest valid school suffix
        let school = null;
        for (let len = 5; len >= 2; len--) {
          if (parts.length > len) {
            const suffix = parts.slice(-len).join(' ');
            if (validSchools.has(suffix)) { school = suffix; break; }
          }
        }
        if (!school) return;
        if (!map[school]) map[school] = { name: school, total: 0, emails: 0, phones: 0, both: 0 };
        map[school].total++;
        const hasEmail = !!(r.email_address && r.email_address.trim());
        const hasPhone = !!(r.phone_number && r.phone_number.trim());
        if (hasEmail) map[school].emails++;
        if (hasPhone) map[school].phones++;
        if (hasEmail && hasPhone) map[school].both++;
      });

      const schools = Object.values(map).map(s => ({ ...s, score: scoreSchool(s) }));
      const scored = schools.filter(s => s.score > 0);
      const avg = scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b.score, 0) / scored.length) : 0;
      const high = scored.filter(s => s.score >= 70).length;

      setSummary({ scored: scored.length, avg, high });
      setSchoolStats(schools);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getSorted = () => {
    let filtered = schoolStats.filter(s => {
      if (tab === 'overall') return s.score > 0;
      if (tab === 'leads') return s.total > 0;
      if (tab === 'phones') return s.phones > 0;
      if (tab === 'emails') return s.emails > 0;
      return true;
    });

    if (tab === 'overall') filtered.sort((a, b) => b.score - a.score);
    else if (tab === 'leads') filtered.sort((a, b) => b.total - a.total);
    else if (tab === 'phones') filtered.sort((a, b) => b.phones - a.phones);
    else if (tab === 'emails') filtered.sort((a, b) => b.emails - a.emails);

    return filtered.slice(0, 10);
  };

  const getMax = (rows) => {
    if (rows.length === 0) return 1;
    if (tab === 'overall') return Math.max(...rows.map(r => r.score));
    if (tab === 'leads') return Math.max(...rows.map(r => r.total));
    if (tab === 'phones') return Math.max(...rows.map(r => r.phones));
    if (tab === 'emails') return Math.max(...rows.map(r => r.emails));
    return 1;
  };

  const getValue = (row) => {
    if (tab === 'overall') return row.score;
    if (tab === 'leads') return row.total;
    if (tab === 'phones') return row.phones;
    if (tab === 'emails') return row.emails;
    return 0;
  };

  const rows = getSorted();
  const max = getMax(rows);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', Segoe UI, sans-serif", background: '#f5f6fa' }}>
      <Sidebar session={session} />

      <div style={{ marginLeft: '175px', flex: 1, padding: '32px', minWidth: 0 }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1d2e', letterSpacing: '-0.3px' }}>Analytics</div>
          <div style={{ fontSize: '13px', color: '#9094a8', marginTop: '2px' }}>School performance and lead data insights</div>
        </div>

        {/* Summary cards — dynamic per tab */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {tab === 'overall' && [
            { label: 'Schools scored', value: summary.scored, color: '#405189' },
            { label: 'Average score', value: summary.avg, color: '#f59e0b' },
            { label: 'High performers (70+)', value: summary.high, color: '#00c896' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '0.5px solid #e8eaf0', borderTop: `3px solid ${s.color}`, borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontSize: '24px', fontWeight: '500', color: '#1a1d2e' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#9094a8', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
          {tab === 'leads' && [
            { label: 'Schools with leads', value: getSorted().length, color: '#405189' },
            { label: 'Top school', value: getSorted()[0]?.name || '—', color: '#3b82f6', small: true },
            { label: 'Most leads', value: getSorted()[0]?.total || 0, color: '#00c896' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '0.5px solid #e8eaf0', borderTop: `3px solid ${s.color}`, borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontSize: s.small ? '14px' : '24px', fontWeight: '500', color: '#1a1d2e' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#9094a8', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
          {tab === 'phones' && [
            { label: 'Schools with phones', value: getSorted().length, color: '#405189' },
            { label: 'Top school', value: getSorted()[0]?.name || '—', color: '#3b82f6', small: true },
            { label: 'Most phones', value: getSorted()[0]?.phones || 0, color: '#00c896' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '0.5px solid #e8eaf0', borderTop: `3px solid ${s.color}`, borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontSize: s.small ? '14px' : '24px', fontWeight: '500', color: '#1a1d2e' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#9094a8', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
          {tab === 'emails' && [
            { label: 'Schools with emails', value: getSorted().length, color: '#405189' },
            { label: 'Top school', value: getSorted()[0]?.name || '—', color: '#3b82f6', small: true },
            { label: 'Most emails', value: getSorted()[0]?.emails || 0, color: '#00c896' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '0.5px solid #e8eaf0', borderTop: `3px solid ${s.color}`, borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontSize: s.small ? '14px' : '24px', fontWeight: '500', color: '#1a1d2e' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#9094a8', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* School Performance */}
        <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px', overflow: 'hidden' }}>

          {/* Card header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8eaf0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#1a1d2e' }}>School Performance</div>

            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e8eaf0', padding: '0 20px' }}>
            {TABS.map(t => (
              <div key={t.key} onClick={() => setTab(t.key)}
                style={{ padding: '10px 16px', fontSize: '13px', cursor: 'pointer', borderBottom: tab === t.key ? '2px solid #405189' : '2px solid transparent', color: tab === t.key ? '#405189' : '#9094a8', fontWeight: tab === t.key ? '600' : '400', marginBottom: '-1px', transition: 'all 0.15s' }}>
                {t.label}
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ padding: '20px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9094a8' }}>
                <div style={{ width: '20px', height: '20px', border: '2px solid #e8eaf0', borderTop: '2px solid #00c896', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                Loading school data...
              </div>
            ) : rows.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9094a8' }}>No scored schools yet. Run more scrapes to build performance data.</div>
            ) : (
              <>
                {/* Legend */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {tab === 'overall' ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9094a8' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#00c896' }} />Score 70–100</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9094a8' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f59e0b' }} />Score 40–69</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9094a8' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#e05c5c' }} />Score 1–39</div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9094a8' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#405189' }} />Count</div>
                  )}
                </div>

                {rows.map((row, i) => {
                  const val = getValue(row);
                  const pct = max > 0 ? (val / max) * 100 : 0;
                  const color = tab === 'overall' ? getColor(row.score) : '#405189';
                  const badge = tab === 'overall' ? getBadgeStyle(row.score) : null;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '220px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', color: '#1a1d2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
                        {tab === 'overall' && badge && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', fontWeight: '600', flexShrink: 0, ...badge }}>{row.score}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, height: '8px', background: '#f0f1f5', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1d2e', width: '50px', textAlign: 'right' }}>{val.toLocaleString()}</div>
                    </div>
                  );
                })}

                {/* Bottom summary — dynamic per tab */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e8eaf0', display: 'flex', gap: '24px' }}>
                  {tab === 'overall' && <>
                    <div><div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1d2e' }}>{summary.scored}</div><div style={{ fontSize: '11px', color: '#9094a8' }}>Schools scored</div></div>
                    <div><div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1d2e' }}>{summary.avg}</div><div style={{ fontSize: '11px', color: '#9094a8' }}>Avg score</div></div>
                    <div><div style={{ fontSize: '18px', fontWeight: '500', color: '#00c896' }}>{summary.high}</div><div style={{ fontSize: '11px', color: '#9094a8' }}>High performers (70+)</div></div>
                  </>}
                  {tab === 'leads' && <>
                    <div><div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1d2e' }}>{rows.length}</div><div style={{ fontSize: '11px', color: '#9094a8' }}>Schools with leads</div></div>
                    <div><div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1d2e' }}>{rows[0]?.name || '—'}</div><div style={{ fontSize: '11px', color: '#9094a8' }}>Top school</div></div>
                    <div><div style={{ fontSize: '18px', fontWeight: '500', color: '#405189' }}>{rows[0]?.total || 0}</div><div style={{ fontSize: '11px', color: '#9094a8' }}>Most leads</div></div>
                  </>}
                  {tab === 'phones' && <>
                    <div><div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1d2e' }}>{rows.length}</div><div style={{ fontSize: '11px', color: '#9094a8' }}>Schools with phones</div></div>
                    <div><div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1d2e' }}>{rows[0]?.name || '—'}</div><div style={{ fontSize: '11px', color: '#9094a8' }}>Top school</div></div>
                    <div><div style={{ fontSize: '18px', fontWeight: '500', color: '#405189' }}>{rows[0]?.phones || 0}</div><div style={{ fontSize: '11px', color: '#9094a8' }}>Most phones</div></div>
                  </>}
                  {tab === 'emails' && <>
                    <div><div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1d2e' }}>{rows.length}</div><div style={{ fontSize: '11px', color: '#9094a8' }}>Schools with emails</div></div>
                    <div><div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1d2e' }}>{rows[0]?.name || '—'}</div><div style={{ fontSize: '11px', color: '#9094a8' }}>Top school</div></div>
                    <div><div style={{ fontSize: '18px', fontWeight: '500', color: '#405189' }}>{rows[0]?.emails || 0}</div><div style={{ fontSize: '11px', color: '#9094a8' }}>Most emails</div></div>
                  </>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}