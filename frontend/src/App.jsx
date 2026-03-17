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
import { Settings, X, Zap, Sparkles, ChevronDown } from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';
import ThemeColorSync from './components/ThemeColorSync';

// ── SlateMark — three-slab logo ───────────────────────────────────────────────
function SlateMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mob-sm-bg" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1c1812"/>
          <stop offset="100%" stopColor="#0c0a08"/>
        </linearGradient>
        <linearGradient id="mob-sm-g1" x1="5" y1="9"  x2="25" y2="9"  gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d4954a"/>
          <stop offset="100%" stopColor="#a06828"/>
        </linearGradient>
        <linearGradient id="mob-sm-g2" x1="7" y1="15" x2="23" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#be7430"/>
          <stop offset="100%" stopColor="#885018"/>
        </linearGradient>
        <linearGradient id="mob-sm-g3" x1="9" y1="21" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9a5c20"/>
          <stop offset="100%" stopColor="#683c10"/>
        </linearGradient>
      </defs>
      <rect width="30" height="30" rx="8" fill="url(#mob-sm-bg)"/>
      <rect x="0" y="0" width="30" height="1" rx="0.5" fill="white" opacity="0.08"/>
      <rect x="5"  y="7"    width="20" height="5"   rx="2.5"  fill="url(#mob-sm-g1)"/>
      <rect x="5"  y="7"    width="20" height="1"   rx="0.5"  fill="white" opacity="0.14"/>
      <rect x="7"  y="14"   width="16" height="4.5" rx="2.25" fill="url(#mob-sm-g2)"/>
      <rect x="9"  y="20.5" width="12" height="4"   rx="2"    fill="url(#mob-sm-g3)"/>
    </svg>
  );
}

// ── Test achievement panel ────────────────────────────────────────────────────
const TEST_ACHIEVEMENTS = [
  { label: '⚡ Level Up overlay',     data: { type: 'level_up', level: 5, old_level: 4, total_xp: 450, message: 'You reached Level 5!' } },
  { label: '🔥 7-day streak reward',  data: { type: 'streak', current_streak: 7,  xp_gained: 60,  milestone_bonus: 50,  message: 'Consistency is the only cheat code.' } },
  { label: '🔥 30-day streak reward', data: { type: 'streak', current_streak: 30, xp_gained: 210, milestone_bonus: 200, message: 'On fire. 30 days straight.' } },
];

function TestPanel({ onTrigger }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.93 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '0 12px', height: '34px', borderRadius: '10px',
          background: open ? 'rgba(184,115,51,0.2)' : 'var(--color-primary-glow)',
          color: 'var(--color-primary)',
          border: '1px solid var(--color-primary-border)',
          cursor: 'pointer', fontSize: '12px', fontWeight: 600,
          letterSpacing: '-0.01em',
          transition: 'all 0.15s',
        }}
      >
        <Sparkles size={11} />
        Demo
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={10} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              zIndex: 300,
              minWidth: '200px',
              borderRadius: '12px',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-primary-border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', inset: '0 0 auto 0', height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.4), transparent)',
            }} />
            <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-3)' }}>
                Feature demos
              </span>
            </div>
            {TEST_ACHIEVEMENTS.map(({ label, data }, i) => (
              <motion.button
                key={label}
                onClick={() => { onTrigger(data); setOpen(false); }}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.1 }}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '10px 12px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  color: 'var(--color-text-2)', fontSize: '12px',
                  borderBottom: i < TEST_ACHIEVEMENTS.length - 1 ? '1px solid var(--color-border)' : 'none',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,115,51,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '13px' }}>{label.split(' ')[0]}</span>
                <span>{label.split(' ').slice(1).join(' ')}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
          background: open ? 'rgba(184,115,51,0.2)' : 'var(--color-primary-glow)',
          border: '1px solid var(--color-primary-border)',
          color: 'var(--color-primary)',
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

export const demoTriggerCallbacks = { current: null };

// ── Mobile top bar ────────────────────────────────────────────────────────────
function MobileTopBar() {
  const handleTrigger = (data) => {
    if (demoTriggerCallbacks.current) {
      demoTriggerCallbacks.current(data);
    }
  };

  return (
    /*
      Two-layer approach:
      1. The solid + frosted background layer — covers content scrolling behind it.
         Uses var(--color-background) so it matches both light (#eceae6) and dark (#0c0a08).
      2. A gradient fade layer at the bottom so the cutoff isn't a hard line.
    */
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      {/* Solid background strip — the actual bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '60px',
        background: 'var(--color-background)',
        // Subtle backdrop blur for a polished feel
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }} />

      {/* Gradient fade below the bar so the edge dissolves naturally */}
      <div style={{
        position: 'absolute',
        top: '60px', left: 0, right: 0,
        height: '16px',
        background: 'linear-gradient(to bottom, var(--color-background), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Content row — logo left, actions right */}
      <div style={{
        position: 'relative',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '16px',
        paddingRight: '16px',
        pointerEvents: 'auto',
      }}>
        {/* Logo + wordmark */}
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <SlateMark size={26} />
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--color-warm-white)',
            lineHeight: 1,
          }}>
            Slate
          </span>
        </motion.div>

        {/* Demo + Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TestPanel onTrigger={handleTrigger} />
          <SettingsButton />
        </div>
      </div>
    </div>
  );
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
      <ThemeColorSync />
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {isMobile && <MobileTopBar />}

        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{
            maxWidth: '1100px',
            margin: '0 auto',
            // Extra top padding accounts for the taller bar (60px solid + 16px fade)
            padding: isMobile ? '76px 16px 120px 16px' : '28px 32px 48px 32px',
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