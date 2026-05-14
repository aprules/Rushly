import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const DASHBOARD_SECTIONS = [
  {
    label: 'Scraper',
    description: 'Data collection tools',
    color: '#00c896',
    bg: '#e8faf5',
    cards: [
      {
        title: 'CampusLabs Scraper',
        description: 'Scrape org contact info from any CampusLabs school directory',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c896" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
        path: '/scraper',
        active: true,
        tag: 'Active'
      }
    ]
  },
  {
    label: 'Viewer',
    description: 'Browse and export your data',
    color: '#3b82f6',
    bg: '#eff6ff',
    cards: [
      {
        title: 'Schools',
        description: 'View all schools from DecoGro with CampusLabs URLs and scrape status',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
        path: '/schools',
        active: true,
        tag: 'Active'
      },
      {
        title: 'Leads Viewer',
        description: 'Browse, filter, sort, and export all scraped leads',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
        path: '/leads',
        active: true,
        tag: 'Active'
      }
    ]
  },
  {
    label: 'Review',
    description: 'Requires human judgement',
    color: '#f59e0b',
    bg: '#fffbeb',
    cards: [
      {
        title: 'Org Review',
        description: 'Review unmatched orgs, edit names, and add to masterlist',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
        path: '/review',
        active: true,
        tag: 'Active'
      }
    ]
  },
  {
    label: 'Pending',
    description: 'Coming soon',
    color: '#9094a8',
    bg: '#f5f6fa',
    cards: [
      {
        title: 'Instagram Scanner',
        description: 'Scan Instagram accounts for contact info in recent posts',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9094a8" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
        path: null,
        active: false,
        tag: 'Coming Soon'
      }
    ]
  }
];


function StatCards({ stats, cardIndex, setCardIndex }) {
  const cards = [
    {
      color: '#00c896',
      slots: [
        { value: stats.leads.toLocaleString(), label: 'Total leads' },
        { value: stats.emails.toLocaleString(), label: 'Total emails' },
        { value: stats.phones.toLocaleString(), label: 'Total phone numbers' },
      ]
    },
    {
      color: '#3b82f6',
      slots: [
        { value: `${stats.schoolsDone} / ${stats.schoolsWithUrl}`, label: 'Schools scraped' },
        { value: stats.schoolsDone.toLocaleString(), label: 'Schools done' },
        { value: stats.schoolsInProgress.toLocaleString(), label: 'Schools in progress' },
      ]
    },
    {
      color: '#f59e0b',
      slots: [
        { value: stats.pendingReview.toLocaleString(), label: 'Pending review' },
        { value: stats.noUrl.toLocaleString(), label: 'No URL' },
        { value: stats.approved.toLocaleString(), label: 'Approved' },
      ]
    },
    {
      color: '#8b5cf6',
      slots: [
        { value: stats.leadsThisWeek.toLocaleString(), label: 'Leads this week' },
        { value: stats.mostScrapedSchool, label: 'Most scraped school' },
        { value: stats.avgLeadsPerSchool.toLocaleString(), label: 'Avg leads per school' },
      ]
    },
  ];

  React.useEffect(() => {
    const timers = cards.map((_, i) =>
      setInterval(() => {
        setCardIndex(prev => {
          const next = [...prev];
          next[i] = (next[i] + 1) % cards[i].slots.length;
          return next;
        });
      }, 10000 + i * 500)
    );
    return () => timers.forEach(clearInterval);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', marginBottom: '28px' }}>
      {cards.map((card, i) => {
        const slot = card.slots[cardIndex[i]];
        return (
          <div key={i} style={{ background: '#fff', border: '0.5px solid #e8eaf0', borderTop: `3px solid ${card.color}`, borderRadius: '8px', padding: '12px 14px', overflow: 'hidden', position: 'relative', minHeight: '68px' }}>
            <div key={`${i}-${cardIndex[i]}`} className="stat-enter">
              <div style={{ fontSize: '22px', fontWeight: '500', color: '#1a1d2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slot.value}</div>
              <div style={{ fontSize: '12px', color: '#9094a8', marginTop: '2px' }}>{slot.label}</div>
            </div>
            {/* Dot indicators */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              {card.slots.map((_, j) => (
                <div key={j} onClick={() => setCardIndex(prev => { const n = [...prev]; n[i] = j; return n; })}
                  style={{ width: j === cardIndex[i] ? '14px' : '5px', height: '5px', borderRadius: '3px', background: j === cardIndex[i] ? card.color : '#e8eaf0', transition: 'all 0.3s', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard({ session }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    leads: 0, emails: 0, phones: 0,
    schoolsDone: 0, schoolsWithUrl: 0, schoolsInProgress: 0,
    pendingReview: 0, noUrl: 0, approved: 0,
    leadsThisWeek: 0, mostScrapedSchool: '—', avgLeadsPerSchool: 0,
  });
  const [cardIndex, setCardIndex] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const fetchStats = async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [leadsRes, emailRes, phoneRes, doneRes, urlRes, inProgressRes, reviewRes, noUrlRes, approvedRes, weekRes] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('leads').select('*', { count: 'exact', head: true }).not('email_address', 'is', null).neq('email_address', ''),
        supabase.from('leads').select('*', { count: 'exact', head: true }).not('phone_number', 'is', null).neq('phone_number', ''),
        supabase.from('schools').select('*', { count: 'exact', head: true }).eq('status', 'done'),
        supabase.from('schools').select('*', { count: 'exact', head: true }).not('campuslabs_url', 'is', null).neq('campuslabs_url', ''),
        supabase.from('schools').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('review').select('*', { count: 'exact', head: true }).eq('atm', false),
        supabase.from('schools').select('*', { count: 'exact', head: true }).or('campuslabs_url.is.null,campuslabs_url.eq.'),
        supabase.from('review').select('*', { count: 'exact', head: true }).eq('atm', true),
        supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      ]);

      // Most scraped school
      const { data: schoolData } = await supabase.from('leads').select('company');
      let mostSchool = '—';
      let avgLeads = 0;
      if (schoolData && schoolData.length > 0) {
        const counts = {};
        schoolData.forEach(r => {
          const parts = r.company?.split(' ');
          if (parts && parts.length > 1) {
            const school = parts.slice(-2).join(' ');
            counts[school] = (counts[school] || 0) + 1;
          }
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) mostSchool = sorted[0][0];
        const done = doneRes.count || 1;
        avgLeads = Math.round((leadsRes.count || 0) / done);
      }

      setStats({
        leads: leadsRes.count || 0,
        emails: emailRes.count || 0,
        phones: phoneRes.count || 0,
        schoolsDone: doneRes.count || 0,
        schoolsWithUrl: urlRes.count || 0,
        schoolsInProgress: inProgressRes.count || 0,
        pendingReview: reviewRes.count || 0,
        noUrl: noUrlRes.count || 0,
        approved: approvedRes.count || 0,
        leadsThisWeek: weekRes.count || 0,
        mostScrapedSchool: mostSchool,
        avgLeadsPerSchool: avgLeads,
      });
    };
    fetchStats();
  }, []);


  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', Segoe UI, sans-serif", background: '#f5f6fa' }}>

      {/* Sidebar */}
      <Sidebar session={session} />

      {/* Main */}
      <div style={{ marginLeft: '175px', flex: 1, padding: '32px' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1d2e', letterSpacing: '-0.3px' }}>Dashboard</div>
          <div style={{ fontSize: '13px', color: '#9094a8', marginTop: '2px' }}>Overview of all Rushly tools and modules</div>
        </div>

        {/* Stats */}
        <style>{`
          @keyframes windowDown {
            0% { transform: translateY(-110%); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          @keyframes windowUp {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(110%); opacity: 0; }
          }
          .stat-enter { animation: windowDown 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          .stat-exit { animation: windowUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        `}</style>
        <StatCards stats={stats} cardIndex={cardIndex} setCardIndex={setCardIndex} />

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {DASHBOARD_SECTIONS.map(section => (
            <div key={section.label}>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '3px', height: '18px', background: section.color, borderRadius: '2px' }} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a1d2e' }}>{section.label}</span>
                  <span style={{ fontSize: '12px', color: '#9094a8', marginLeft: '175px' }}>{section.description}</span>
                </div>
              </div>

              {/* Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', maxWidth: '900px' }}>
                {section.cards.map(card => (
                  <div key={card.title}
                    onClick={() => card.active && card.path && navigate(card.path)}
                    style={{
                      background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px',
                      padding: '20px', cursor: card.active ? 'pointer' : 'default',
                      opacity: card.active ? 1 : 0.6,
                      transition: 'box-shadow 0.15s, border-color 0.15s'
                    }}
                    onMouseEnter={e => { if (card.active) { e.currentTarget.style.boxShadow = `0 4px 20px ${section.color}20`; e.currentTarget.style.borderColor = section.color; }}}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e8eaf0'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ width: '38px', height: '38px', background: section.bg, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {card.icon}
                      </div>
                      <span style={{
                        fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '20px',
                        background: card.active ? section.bg : '#f5f6fa',
                        color: card.active ? section.color : '#9094a8',
                        letterSpacing: '0.3px'
                      }}>{card.tag}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1d2e', marginBottom: '5px' }}>{card.title}</div>
                    <div style={{ fontSize: '12px', color: '#9094a8', lineHeight: '1.6', marginBottom: '14px' }}>{card.description}</div>
                    {card.active && card.path && (
                      <div style={{ fontSize: '12px', color: section.color, fontWeight: '600' }}>Open →</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
