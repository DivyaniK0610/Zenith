import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import AICoach from './pages/AICoach';
import Timer from './pages/Timer';
import Goals from './pages/Goals';
import { AnimatePresence, motion } from 'framer-motion';
import { useHabitStore } from './store/habitStore';
import { Settings, X, Zap } from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';

// ── Settings popover ──────────────────────────────────────────────────────────
function SettingsPopover({ onClose, anchorRef }) {
  const { userStats } = useHabitStore();
  const popoverRef = useRef(null);
  const level     = userStats?.level || 1;
  const xp        = userStats?.xp || 0;
  const xpInLevel = xp % 100;

  useEffect(() => {
    const handler = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        anchorRef.current  && !anchorRef.current.contains(e.target)
      ) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  return (
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, scale: 0.93, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: -8 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        zIndex: 300,
        width: '230px',
        borderRadius: '16px',
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', inset: '0 0 auto 0', height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.4), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Profile */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
            boxShadow: '0 2px 10px rgba(184,115,51,0.3)',
            fontSize: '16px', fontWeight: 700, color: 'white',
          }}>
            S
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-warm-white)', letterSpacing: '-0.01em' }}>
              User
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '1px' }}>
              Level {level} · {xp} XP total
            </div>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={9} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-3)' }}>
                Level {level}
              </span>
            </div>
            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
              {xpInLevel}/100 XP
            </span>
          </div>
          <div style={{ height: '4px', background: 'var(--color-stone)', borderRadius: '99px', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', borderRadius: '99px', background: 'linear-gradient(90deg, var(--color-primary-dim), var(--color-primary))' }}
              initial={{ width: 0 }}
              animate={{ width: `${xpInLevel}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </div>

      {/* Theme */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '8px', paddingLeft: '2px' }}>
          Appearance
        </div>
        <ThemeToggle />
      </div>
    </motion.div>
  );
}

// ── Settings button ───────────────────────────────────────────────────────────
function SettingsButton() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <motion.button
        ref={btnRef}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(o => !o)}
        style={{
          width: '34px', height: '34px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'rgba(184,115,51,0.12)' : 'var(--color-stone)',
          border: `1px solid ${open ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
          color: open ? 'var(--color-primary)' : 'var(--color-text-3)',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x"
              initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={14} />
            </motion.div>
          ) : (
            <motion.div key="gear"
              initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Settings size={14} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && <SettingsPopover onClose={() => setOpen(false)} anchorRef={btnRef} />}
      </AnimatePresence>
    </div>
  );
}

// ── useIsMobile ───────────────────────────────────────────────────────────────
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

// ── App shell ─────────────────────────────────────────────────────────────────
function AppInner() {
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    <div style={{
      display: 'flex',
      height: '100dvh',
      overflow: 'hidden',
      background: 'var(--color-background)',
    }}>
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/*
          Mobile-only top bar.
          - Only rendered when isMobile is true (JS-gated, not CSS-only).
          - Zero background so it's fully transparent — just the gear button floats.
          - Fixed height (48px) reserves space so page content starts below it.
          - No border, no background color.
        */}
        {isMobile && (
          <div style={{
            flexShrink: 0,
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '20px',
            paddingLeft: '20px',
            background: 'transparent',
          }}>
            <SettingsButton />
          </div>
        )}

        {/* Scrollable content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: isMobile ? '16px 20px 120px 20px' : '28px 32px 48px 32px',
          }}>
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