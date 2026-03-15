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
import { AnimatePresence, motion } from 'framer-motion';
import { useHabitStore } from './store/habitStore';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';

// ── Floating mobile avatar (top-right) ───────────────────────────────────────
function MobileAvatar() {
  const { userStats } = useHabitStore();
  const level     = userStats?.level || 1;
  const xp        = userStats?.xp || 0;
  const xpInLevel = xp % 100;
  const streak    = userStats?.current_streak || 0;
  const r         = 13;
  const circ      = 2 * Math.PI * r;

  return (
    <div
      className="md:hidden"
      style={{
        position: 'fixed', top: '10px', right: '12px', zIndex: 50,
        display: 'flex', alignItems: 'center', gap: '6px',
      }}
    >
      {/* Streak pill — only show if streak > 0 */}
      {streak > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            padding: '3px 8px', borderRadius: '99px',
            background: 'rgba(13,11,8,0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(224,120,48,0.3)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{ fontSize: '11px', lineHeight: 1 }}>🔥</span>
          <span style={{
            fontSize: '11px', fontWeight: 700,
            fontFamily: 'var(--font-mono)', color: '#e07830',
            lineHeight: 1,
          }}>
            {streak}d
          </span>
        </motion.div>
      )}

      {/* Avatar circle with XP ring */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {/* XP ring SVG */}
        <svg
          width="36" height="36" viewBox="0 0 36 36"
          style={{ position: 'absolute', top: '-3px', left: '-3px', overflow: 'visible' }}
        >
          {/* Track */}
          <circle
            cx="18" cy="18" r={r}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="2"
          />
          {/* Progress */}
          <motion.circle
            cx="18" cy="18" r={r}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - xpInLevel / 100) }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            transform="rotate(-90 18 18)"
            style={{
              filter: 'drop-shadow(0 0 3px rgba(184,115,51,0.6))',
            }}
          />
        </svg>

        {/* Avatar chip */}
        <div style={{
          width: '30px', height: '30px', borderRadius: '9px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(13,11,8,0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--color-stone-light)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
          fontSize: '12px', fontWeight: 700,
          color: 'var(--color-text-2)',
          position: 'relative', zIndex: 1,
        }}>
          Z
        </div>

        {/* Level badge */}
        <div style={{
          position: 'absolute', bottom: '-4px', right: '-4px', zIndex: 2,
          background: 'var(--color-primary)',
          borderRadius: '5px',
          padding: '1px 4px',
          border: '1.5px solid rgba(13,11,8,0.9)',
          lineHeight: 1,
        }}>
          <span style={{
            fontSize: '8px', fontWeight: 800,
            fontFamily: 'var(--font-mono)', color: 'white',
          }}>
            {level}
          </span>
        </div>
      </div>
    </div>
  );
}

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
        <div
          className="w-full px-4 py-1.5 flex items-center justify-center gap-2 flex-shrink-0"
          style={{ background: s.bg, borderBottom: `1px solid ${s.border}` }}
        >
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

      {/* Floating avatar — mobile only, top-right */}
      <MobileAvatar />

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