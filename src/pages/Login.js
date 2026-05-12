import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import logo from '../assets/rushly.png';

// ─── FLOATING DOTS ───
function FloatingDots() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const dots = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.4 + 0.1
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${d.opacity})`;
        ctx.fill();
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = canvas.width;
        if (d.x > canvas.width) d.x = 0;
        if (d.y < 0) d.y = canvas.height;
        if (d.y > canvas.height) d.y = 0;
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address first.'); return; }
    setForgotLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password'
    });
    if (error) setError(error.message);
    else setForgotSent(true);
    setForgotLoading(false);
  };

  const inputStyle = {
    width: '100%', height: '38px',
    background: '#fff',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    padding: '0 14px',
    fontSize: '14px',
    color: '#1a1d2e',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: "'Nunito', 'DM Sans', sans-serif"
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');`}</style>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Nunito', 'DM Sans', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        background: '#f3f3f9'
      }}>

        {/* ── NAVY BACKGROUND WITH COVER IMAGE ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '39%', zIndex: 0,
          backgroundImage: 'url("https://software.apparelprofits.com/templates/themes/tsc/skin/images/cover.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          {/* Navy overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(64,81,137,0.88)'
          }} />
          {/* Dots */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <FloatingDots />
          </div>
        </div>

        {/* ── WAVE DIVIDER — exact DecoGro SVG path, positioned low ── */}
        <div style={{
          position: 'absolute',
          top: 'calc(39% - 39px)',
          left: 0, right: 0,
          height: '39px',
          zIndex: 2
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', display: 'block' }}>
            <path d="M 0,0 C 480,160 960,160 1440,0 L1440 140 L0 140z" fill="#f3f3f9"/>
          </svg>
        </div>

        {/* ── LIGHT BOTTOM ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '10%', background: '#f3f3f9', zIndex: 1
        }} />

        {/* ── CARD — sits in the navy area like DecoGro ── */}
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          flex: 1, paddingTop: '200px', paddingBottom: '20px', paddingLeft: '20px', paddingRight: '20px'
        }}>
          <div style={{
            width: '400px',
            background: '#fff',
            borderRadius: '5px',
            padding: '45px 30px 70px',
            boxShadow: '0 1px 2px rgba(56,65,74,0.15)'
          }}>

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '5px' }}>
              <img
                src={logo}
                alt="Rushly"
                style={{ height: '90px', width: 'auto', marginBottom: '10px', }}
              />
              {!forgotMode && (
                <>
                  <h5 style={{ fontSize: '16px', fontWeight: '700', color: '#405189', margin: '0 0 5px' }}>Welcome Back!</h5>
                  <p style={{ fontSize: '13px', color: '#878a99', margin: 5 }}>Sign in to continue to Rushly.</p>
                </>
              )}
              {forgotMode && (
                <>
                  <h5 style={{ fontSize: '16px', fontWeight: '700', color: '#405189', margin: '0 0 5px' }}>Reset Password</h5>
                  <p style={{ fontSize: '13px', color: '#878a99', margin: 0 }}>We'll send a reset link to your email.</p>
                </>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px',
                padding: '10px 14px', fontSize: '13px', color: '#e05c5c', margin: '12px 0'
              }}>{error}</div>
            )}

            {/* Reset sent */}
            {forgotSent && (
              <div style={{
                background: '#f0fdf8', border: '1px solid #b3eed9', borderRadius: '6px',
                padding: '12px 14px', fontSize: '13px', color: '#00875a',
                margin: '12px 0', textAlign: 'center'
              }}>✓ Reset link sent! Check your email.</div>
            )}

            {/* ── LOGIN FORM ── */}
            {!forgotMode && (
              <form onSubmit={handleLogin} style={{ marginTop: '30px' }}>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#1a1d2e', marginBottom: '6px' }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="Enter email address" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#405189'; e.target.style.boxShadow = '0 0 0 3px rgba(64,81,137,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#ced4da'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#1a1d2e', marginBottom: '6px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="Enter password" style={{ ...inputStyle, paddingRight: '44px' }}
                      onFocus={e => { e.target.style.borderColor = '#405189'; e.target.style.boxShadow = '0 0 0 3px rgba(64,81,137,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = '#ced4da'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)} style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#878a99', padding: 0, display: 'flex'
                    }}>
                      {showPassword
                        ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                {/* Remember me + Forgot */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#1a1d2e', userSelect: 'none' }}>
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                      style={{ width: '15px', height: '15px', accentColor: '#405189', cursor: 'pointer' }} />
                    Remember me
                  </label>
                  <button type="button" onClick={() => { setForgotMode(true); setError(''); setForgotSent(false); }}
                    style={{ background: 'none', border: 'none', fontSize: '13px', color: '#299cdb', cursor: 'pointer', fontWeight: '600', padding: 0, fontFamily: "'Nunito', sans-serif" }}>
                    Forgot Password
                  </button>
                </div>

                <button type="submit" disabled={loading} style={{
                  width: '100%', height: '38px', background: '#0ab39c',
                  color: '#fff', border: 'none', borderRadius: '6px',
                  fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1, transition: 'background 0.15s',
                  fontFamily: "'Nunito', sans-serif", letterSpacing: '0.3px'
                }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#099885'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0ab39c'; }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* ── FORGOT PASSWORD FORM ── */}
            {forgotMode && !forgotSent && (
              <form onSubmit={handleForgotPassword} style={{ marginTop: '0px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1d2e', marginBottom: '6px' }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="Enter your email address" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#405189'; e.target.style.boxShadow = '0 0 0 3px rgba(64,81,137,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#ced4da'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <button type="submit" disabled={forgotLoading} style={{
                  width: '100%', height: '38px', background: '#0ab39c', color: '#fff',
                  border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '700',
                  cursor: forgotLoading ? 'not-allowed' : 'pointer', marginBottom: '12px',
                  fontFamily: "'Nunito', sans-serif"
                }}>
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => { setForgotMode(false); setError(''); }}
                  style={{ width: '100%', height: '40px', background: 'none', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '13px', color: '#878a99', cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
                  ← Back to Sign In
                </button>
              </form>
            )}

            {forgotMode && forgotSent && (
              <button type="button" onClick={() => { setForgotMode(false); setForgotSent(false); setError(''); }}
                style={{ width: '100%', height: '40px', background: 'none', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '13px', color: '#878a99', cursor: 'pointer', marginTop: '12px', fontFamily: "'Nunito', sans-serif" }}>
                ← Back to Sign In
              </button>
            )}

          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '16px 0 20px', fontSize: '13px', color: '#878a99' }}>
          © 2026 Rushly — A DecoGro Product
        </div>

      </div>
    </>
  );
}
