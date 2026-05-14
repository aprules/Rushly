import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const TIMEZONES = [
  'Pacific/Honolulu (GMT-10:00)',
  'America/Anchorage (GMT-09:00)',
  'America/Los_Angeles (GMT-08:00)',
  'America/Denver (GMT-07:00)',
  'America/Chicago (GMT-06:00)',
  'America/New_York (GMT-05:00)',
  'America/Sao_Paulo (GMT-03:00)',
  'Europe/London (GMT+00:00)',
  'Europe/Paris (GMT+01:00)',
  'Europe/Helsinki (GMT+02:00)',
  'Europe/Moscow (GMT+03:00)',
  'Asia/Dubai (GMT+04:00)',
  'Asia/Karachi (GMT+05:00)',
  'Asia/Dhaka (GMT+06:00)',
  'Asia/Bangkok (GMT+07:00)',
  'Asia/Manila (GMT+08:00)',
  'Asia/Tokyo (GMT+09:00)',
  'Australia/Sydney (GMT+10:00)',
  'Pacific/Auckland (GMT+12:00)',
];

export default function Profile({ session }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('general');

  // General
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('Asia/Manila (GMT+08:00)');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  const email = session?.user?.email || '';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Load saved profile from user metadata
  useEffect(() => {
    const meta = session?.user?.user_metadata || {};
    if (meta.phone) setPhone(meta.phone);
    if (meta.timezone) setTimezone(meta.timezone);
    if (meta.first_name) setFirstName(meta.first_name);
    if (meta.last_name) setLastName(meta.last_name);
  }, [session]);

  const handleSaveGeneral = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: { phone, timezone, first_name: firstName, last_name: lastName } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSavePassword = async () => {
    setPwError('');
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPwError(error.message); setPwSaving(false); return; }
    setPwSaving(false);
    setPwSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPwSaved(false), 2500);
  };

  const inputStyle = {
    width: '100%', height: '38px', background: '#fff',
    border: '1px solid #e2e8f0', borderRadius: '6px',
    padding: '0 12px', fontSize: '14px', color: '#1a1d2e',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif"
  };

  const labelStyle = {
    display: 'block', fontSize: '13px', fontWeight: '600',
    color: '#1a1d2e', marginBottom: '6px'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f8', fontFamily: "'DM Sans', Segoe UI, sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ background: '#405189', padding: '12px 24px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Back to Home
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, maxWidth: '900px', margin: '32px auto', width: '100%', padding: '0 24px', gap: '24px', alignItems: 'flex-start' }}>

        {/* Left nav */}
        <div style={{ width: '180px', flexShrink: 0, background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', fontSize: '10px', fontWeight: '700', color: '#9094a8', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #f0f1f5' }}>Profile</div>
          {[
            { key: 'general', label: 'General', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg> },
            { key: 'password', label: 'Password', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
          ].map(item => (
            <div key={item.key} onClick={() => setTab(item.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: tab === item.key ? '600' : '400', color: tab === item.key ? '#405189' : '#6b7280', background: tab === item.key ? '#f0f2f8' : 'transparent', borderLeft: tab === item.key ? '3px solid #405189' : '3px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (tab !== item.key) e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { if (tab !== item.key) e.currentTarget.style.background = 'transparent'; }}
            >
              {item.icon}{item.label}
            </div>
          ))}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>

          {/* Tab header */}
          <div style={{ borderBottom: '1px solid #e2e8f0', padding: '0 24px' }}>
            <div style={{ display: 'inline-block', padding: '14px 0', fontSize: '14px', fontWeight: '600', color: '#405189', borderBottom: '2px solid #405189', marginBottom: '-1px' }}>
              {tab === 'general' ? 'General' : 'Change Password'}
            </div>
          </div>

          <div style={{ padding: '28px 24px' }}>

            {tab === 'general' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={labelStyle}>First Name</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#405189'; e.target.style.boxShadow = '0 0 0 3px rgba(64,81,137,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#405189'; e.target.style.boxShadow = '0 0 0 3px rgba(64,81,137,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input value={email} disabled style={{ ...inputStyle, background: '#f9fafb', color: '#9094a8', cursor: 'not-allowed' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#405189'; e.target.style.boxShadow = '0 0 0 3px rgba(64,81,137,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px', maxWidth: '440px' }}>
                  <label style={labelStyle}>Timezone</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </>
            )}

            {tab === 'password' && (
              <>
                <div style={{ marginBottom: '20px', maxWidth: '440px' }}>
                  <label style={labelStyle}>Current Password</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#405189'; e.target.style.boxShadow = '0 0 0 3px rgba(64,81,137,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#9094a8' }}>
                    Forgot your password?{' '}
                    <span style={{ color: '#405189', cursor: 'pointer', fontWeight: '500' }} onClick={async () => {
                      await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' });
                      alert('Reset link sent to ' + email);
                    }}>Reset password via email</span>
                  </div>
                </div>

                <div style={{ marginBottom: '20px', maxWidth: '440px' }}>
                  <label style={labelStyle}>New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#405189'; e.target.style.boxShadow = '0 0 0 3px rgba(64,81,137,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <div style={{ marginBottom: '20px', maxWidth: '440px' }}>
                  <label style={labelStyle}>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#405189'; e.target.style.boxShadow = '0 0 0 3px rgba(64,81,137,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                {pwError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#e05c5c', marginBottom: '16px', maxWidth: '440px' }}>
                    {pwError}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom action bar */}
          <div style={{ position: 'fixed', bottom: '24px', right: '32px', display: 'flex', gap: '8px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', padding: '10px 16px', border: '1px solid #e2e8f0' }}>
            <button onClick={() => { setPhone(''); setTimezone('Asia/Manila (GMT+08:00)'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPwError(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontSize: '13px', color: '#6b7280', cursor: 'pointer', padding: '6px 10px', fontFamily: "'DM Sans', sans-serif" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Cancel Changes
            </button>
            <button
              onClick={tab === 'general' ? handleSaveGeneral : handleSavePassword}
              disabled={saving || pwSaving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: saved || pwSaved ? '#e8faf5' : '#405189', border: 'none', borderRadius: '6px', padding: '6px 16px', fontSize: '13px', color: saved || pwSaved ? '#00c896' : '#fff', cursor: 'pointer', fontWeight: '600', fontFamily: "'DM Sans', sans-serif" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              {saved || pwSaved ? '✓ Saved!' : saving || pwSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
