import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import AICoach from './pages/AICoach';
import Timer from './pages/Timer';
import Goals from './pages/Goals';
import { checkBackendHealth } from './api/client';
import { Activity } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

function AppInner() {
  const location = useLocation();
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const verify = async () => {
      try {
        await checkBackendHealth();
        setBackendStatus('connected');
      } catch {
        setBackendStatus('error');
      }
    };
    verify();
  }, []);

  const bannerStyles = {
    connected: { bg: 'rgba(82,168,115,0.08)',  color: '#6fcf8a',              border: 'rgba(82,168,115,0.15)'  },
    error:     { bg: 'rgba(220,60,60,0.08)',   color: '#f87171',              border: 'rgba(220,60,60,0.15)'   },
    checking:  { bg: 'rgba(184,115,51,0.08)',  color: 'var(--color-primary)', border: 'rgba(184,115,51,0.15)'  },
  };
  const s = bannerStyles[backendStatus] || bannerStyles.checking;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-background)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Status banner */}
        <div className="w-full px-4 py-1.5 flex items-center justify-center gap-2 flex-shrink-0"
          style={{ background: s.bg, borderBottom: `1px solid ${s.border}` }}>
          <Activity size={10} style={{ color: s.color }} />
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: s.color }}>
            {backendStatus === 'connected' && 'Backend Connected'}
            {backendStatus === 'error'     && 'Backend Disconnected — start FastAPI on port 8000'}
            {backendStatus === 'checking'  && 'Connecting…'}
          </span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="px-5 pt-7 pb-28 md:px-8 md:pb-12 w-full" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/"          element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/goals"     element={<Goals />} />
                <Route path="/coach"     element={<AICoach />} />
                <Route path="/timer"     element={<Timer />} />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}