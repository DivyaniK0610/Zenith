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
import { useHabitStore } from './store/habitStore';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return isMobile;
}

function MobileUserAvatar({ userStats }) {
  const level     = userStats?.level || 1;
  const xp        = userStats?.xp || 0;
  const xpInLevel = xp % 100;
  const S         = 30;
  const stroke    = 2.5;
  const r         = (S - stroke) / 2;
  const circ      = 2 * Math.PI * r;

  return (
    <div style={{ position: 'relative', width: `${S}px`, height: `${S}px`, flexShrink: 0 }}>
      <svg
        width={S} height={S} viewBox={`0 0 ${S} ${S}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <circle cx={S/2} cy={S/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={S/2} cy={S/2} r={r} fill="none"
          stroke="var(--color-primary)"
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - xpInLevel / 100)}
          transform={`rotate(-90 ${S/2} ${S/2})`}
          style={{ filter: 'drop-shadow(0 0 3px rgba(184,115,51,0.5))' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: `${stroke + 1}px`, left: `${stroke + 1}px`,
        width: `${S - (stroke + 1) * 2}px`, height: `${S - (stroke + 1) * 2}px`,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #2e2418, #1a1610)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: 700, color: 'var(--color-text-1)',
      }}>
        Z
      </div>
      <div style={{
        position: 'absolute', bottom: '-3px', right: '-3px',
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
        borderRadius: '4px', padding: '1px 3px',
        border: '1.5px solid rgba(12,10,8,0.95)', lineHeight: 1,
      }}>
        <span style={{ fontSize: '7px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'white' }}>
          {level}
        </span>
      </div>
    </div>
  );
}

function AppInner() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { userStats } = useHabitStore();
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

        {/* ── Top bar: status banner + mobile avatar ── */}
        <div
  className="w-full flex items-center flex-shrink-0"
  style={{  minHeight: '28px', position: 'relative', overflow: 'hidden', }}
>
  {/* Status text — always centered regardless of avatar */}
  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', pointerEvents: 'none' }}>
    <Activity size={10} style={{ color: s.color }} />
    <span style={{
      fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em',
      textTransform: 'uppercase', color: s.color,
    }}>
      {backendStatus === 'connected' && 'Backend Connected'}
      {backendStatus === 'error'     && 'Backend Disconnected — start FastAPI on port 8000'}
      {backendStatus === 'checking'  && 'Connecting…'}
    </span>
  </div>

  {/* Spacer so the bar has height even with no content */}
  <div style={{ flex: 1, padding: '5px 0' }} />

  {/* Avatar — only on mobile, always anchored to the right */}
  {isMobile && (
    <div style={{ paddingRight: '12px', paddingTop: '12px',paddingBottom: '12px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
      <MobileUserAvatar userStats={userStats} />
    </div>
  )}
</div>

        <main className="flex-1 overflow-y-auto">
          <div
            className="px-5 pt-7 pb-28 md:px-8 md:pb-12 w-full"
            style={{ maxWidth: '1100px', margin: '0 auto' }}
          >
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