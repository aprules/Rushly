import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scraper from './pages/Scraper';
import Leads from './pages/Leads';
import Review from './pages/Review';
import Schools from './pages/Schools';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f6fa', color: '#9094a8', fontSize: '14px', fontFamily: 'Segoe UI, sans-serif' }}>
      Loading...
    </div>
  );

  return (
    <Routes>
      <Route path="/login"     element={!session ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/login" />} />
      <Route path="/scraper"   element={session ? <Scraper session={session} /> : <Navigate to="/login" />} />
      <Route path="/leads"     element={session ? <Leads session={session} /> : <Navigate to="/login" />} />
      <Route path="/review"    element={session ? <Review session={session} /> : <Navigate to="/login" />} />
      <Route path="/schools"   element={session ? <Schools session={session} /> : <Navigate to="/login" />} />
      <Route path="*"          element={<Navigate to={session ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default App;
