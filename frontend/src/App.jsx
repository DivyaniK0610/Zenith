import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import AICoach from './pages/AICoach';
import Timer from './pages/Timer';
import Goals from './pages/Goals';
import Achievements from './pages/Achievements';
import { ACHIEVEMENT_DEFS } from './pages/Achievements';
import { AnimatePresence, motion } from 'framer-motion';
import { useHabitStore } from './store/habitStore';
import { useZenithSounds } from './hooks/useSound';
import { Settings, X, Zap, Sparkles, ChevronDown, Trophy, ChevronRight, Share2 } from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';
import ThemeColorSync from './components/ThemeColorSync';
import { AchievementUnlockOverlay } from './pages/Achievements';

// ── SlateMark ─────────────────────────────────────────────────────────────────
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

// ── Demo Panel ────────────────────────────────────────────────────────────────
const TEST_ACHIEVEMENTS = [
  { label: '⚡ Level Up overlay',     data: { type: 'level_up', level: 5, old_level: 4, total_xp: 450, message: 'You reached Level 5!' } },
  { label: '🔥 7-day streak reward',  data: { type: 'streak', current_streak: 7,  xp_gained: 60,  milestone_bonus: 50,  message: 'Consistency is the only cheat code.' } },
  { label: '🔥 30-day streak reward', data: { type: 'streak', current_streak: 30, xp_gained: 210, milestone_bonus: 200, message: 'On fire. 30 days straight.' } },
  { label: '🏆 Achievement unlock',   data: { type: 'achievement', achievementId: 'streak_7' } },
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
              minWidth: '210px',
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

// ── Settings Popover ──────────────────────────────────────────────────────────
function SettingsPopover({ onClose, anchorRef }) {
  const { userStats } = useHabitStore();
  const popoverRef = useRef(null);
  const navigate   = useNavigate();
  const level      = userStats?.level || 1;
  const xp         = userStats?.xp || 0;
  const xpInLevel  = xp % 100;

  const { habits } = useHabitStore();
  const earnedCount = ACHIEVEMENT_DEFS.filter(def => def.check(userStats, habits)).length;

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
        width: '246px',
        borderRadius: '16px',
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}
    >
      {/* Top shimmer */}
      <div style={{
        position: 'absolute', inset: '0 0 auto 0', height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.4), transparent)',
        pointerEvents: 'none',
      }} />

      {/* User section */}
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
        {/* XP bar */}
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

      {/* Achievements row */}
      <motion.button
        whileHover={{ x: 2 }}
        onClick={() => { navigate('/achievements'); onClose(); }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          borderBottom: '1px solid var(--color-border)',
          transition: 'background 0.15s',
          fontFamily: 'var(--font-sans)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,115,51,0.06)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{
          width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(201,164,58,0.12)', border: '1px solid rgba(201,164,58,0.25)',
        }}>
          <Trophy size={14} style={{ color: '#c9a43a' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-1)' }}>Achievements</div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-3)', marginTop: '1px' }}>
            {earnedCount} of {ACHIEVEMENT_DEFS.length} unlocked
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '3px', background: 'var(--color-stone)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '99px', background: '#c9a43a', width: `${Math.round((earnedCount / ACHIEVEMENT_DEFS.length) * 100)}%` }} />
          </div>
          <ChevronRight size={11} style={{ color: 'var(--color-text-3)' }} />
        </div>
      </motion.button>

      {/* Appearance */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '8px', paddingLeft: '2px' }}>
          Appearance
        </div>
        <ThemeToggle />
      </div>
    </motion.div>
  );
}

// ── Settings Button ───────────────────────────────────────────────────────────
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

// ── Mobile Top Bar ────────────────────────────────────────────────────────────
function MobileTopBar() {
  const handleTrigger = (data) => {
    if (demoTriggerCallbacks.current) {
      demoTriggerCallbacks.current(data);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '60px',
        background: 'var(--color-background)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }} />
      <div style={{
        position: 'absolute',
        top: '60px', left: 0, right: 0,
        height: '16px',
        background: 'linear-gradient(to bottom, var(--color-background), transparent)',
        pointerEvents: 'none',
      }} />
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TestPanel onTrigger={handleTrigger} />
          <SettingsButton />
        </div>
      </div>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
function AppInner() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { userStats } = useHabitStore();

  const [activeOverlay, setActiveOverlay]   = useState(null);
  const [shareTarget, setShareTarget]       = useState(null);

  // Wire up demo trigger
  useEffect(() => {
    demoTriggerCallbacks.current = (data) => {
      if (data.type === 'achievement') {
        const def = ACHIEVEMENT_DEFS.find(d => d.id === data.achievementId);
        if (def) setActiveOverlay({ type: 'achievement', def });
      } else {
        setActiveOverlay({ type: 'legacy', data });
      }
    };
    return () => { demoTriggerCallbacks.current = null; };
  }, []);

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
            padding: isMobile ? '76px 16px 120px 16px' : '28px 32px 48px 32px',
          }}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/"              element={<Dashboard />} />
                <Route path="/analytics"     element={<Analytics />} />
                <Route path="/goals"         element={<Goals />} />
                <Route path="/achievements"  element={<Achievements />} />
                <Route path="/coach"         element={<AICoach />} />
                <Route path="/timer"         element={<Timer />} />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <MobileNav />

      {/* ── Legacy overlays (level-up / streak) ── */}
      <AnimatePresence>
        {activeOverlay?.type === 'legacy' && (
          <LegacyOverlayWithShare
            data={activeOverlay.data}
            userStats={userStats}
            onClose={() => setActiveOverlay(null)}
            onShare={(def) => { setActiveOverlay(null); setShareTarget(def); }}
          />
        )}
      </AnimatePresence>

      {/* ── New achievement unlock overlay ── */}
      <AnimatePresence>
        {activeOverlay?.type === 'achievement' && (
          <AchievementUnlockOverlay
            achievement={activeOverlay.def}
            userStats={userStats}
            onClose={() => setActiveOverlay(null)}
            onShare={(def) => { setActiveOverlay(null); setShareTarget(def); }}
          />
        )}
      </AnimatePresence>

      {/* ── Share modal ── */}
      <AnimatePresence>
        {shareTarget && (
          <ShareModalPortal
            achievement={shareTarget}
            userStats={userStats}
            onClose={() => setShareTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ShareModalPortal ──────────────────────────────────────────────────────────
import { createPortal } from 'react-dom';

function ShareModalPortal({ achievement, userStats, onClose }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [generating, setGenerating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    generateShareCardInline(achievement, userStats).then(url => {
      setImageUrl(url);
      setGenerating(false);
    });
  }, [achievement, userStats]);

  const handleDownload = () => {
    if (!imageUrl) return;
    setDownloading(true);
    const link = document.createElement('a');
    link.download = `slate-${achievement.id}-achievement.png`;
    link.href = imageUrl;
    link.click();
    setTimeout(() => setDownloading(false), 1000);
  };

  const handleNativeShare = async () => {
    if (!imageUrl) return;
    try {
      const blob = await fetch(imageUrl).then(r => r.blob());
      const file = new File([blob], `slate-${achievement.id}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `I earned "${achievement.title}" on Slate!`,
          text: `${achievement.description} 🏆 Track habits, build streaks, level up.`,
          files: [file],
        });
      } else {
        handleDownload();
      }
    } catch (_) { handleDownload(); }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(
      `Just earned "${achievement.title}" on Slate! ${achievement.description} 🏆 #SlateApp #HabitTracking`
    ).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
      />
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 10 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}
        >
          <div style={{ borderRadius: '20px', overflow: 'hidden', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: `linear-gradient(90deg, transparent, ${achievement.color}80, transparent)` }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-warm-white)', letterSpacing: '-0.02em' }}>Share Achievement</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '2px' }}>Download or share to Instagram</div>
              </div>
              <button onClick={onClose}
                style={{ width: '30px', height: '30px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', color: 'var(--color-text-3)', cursor: 'pointer' }}>
                <X size={13} />
              </button>
            </div>

            {/* Preview */}
            <div style={{ padding: '0 20px 14px' }}>
              <div style={{ borderRadius: '14px', overflow: 'hidden', background: 'var(--color-stone)', border: '1px solid var(--color-border)', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {generating ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Sparkles size={24} style={{ color: achievement.color }} />
                    </motion.div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>Generating card…</span>
                  </div>
                ) : (
                  <img src={imageUrl} alt="Achievement card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleNativeShare} disabled={generating}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, color: 'white', background: generating ? 'var(--color-stone)' : `linear-gradient(135deg, ${achievement.color}, ${achievement.color}cc)`, border: `1px solid ${achievement.border}`, cursor: generating ? 'default' : 'pointer', boxShadow: generating ? 'none' : `0 4px 20px ${achievement.glow}`, transition: 'all 0.2s' }}>
                <Share2 size={15} />
                Share to Instagram
              </motion.button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleDownload} disabled={generating}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '11px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-1)', background: 'var(--color-stone)', border: '1px solid var(--color-border)', cursor: generating ? 'default' : 'pointer', opacity: downloading ? 0.7 : 1 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {downloading ? 'Saving…' : 'Save PNG'}
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleCopyText}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '11px', fontSize: '12px', fontWeight: 600, color: copied ? '#6fcf8a' : 'var(--color-text-1)', background: copied ? 'rgba(82,168,115,0.1)' : 'var(--color-stone)', border: `1px solid ${copied ? 'rgba(82,168,115,0.3)' : 'var(--color-border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {copied
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  }
                  {copied ? 'Copied!' : 'Copy text'}
                </motion.button>
              </div>

              <p style={{ fontSize: '10px', color: 'var(--color-text-3)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                1080×1080 PNG · optimized for Instagram &amp; Stories
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>,
    document.body
  );
}

// ── Canvas card generator ─────────────────────────────────────────────────────
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function generateShareCardInline(achievement, userStats) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
    bgGrad.addColorStop(0, '#0c0a08');
    bgGrad.addColorStop(0.5, '#1a1510');
    bgGrad.addColorStop(1, '#0c0a08');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 1080; i += 60) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1080); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke();
    }

    const glowGrad = ctx.createRadialGradient(540, 480, 0, 540, 480, 500);
    glowGrad.addColorStop(0, (achievement.glow || 'rgba(184,115,51,0.18)').replace('0.4', '0.18'));
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    const topLine = ctx.createLinearGradient(0, 0, 1080, 0);
    topLine.addColorStop(0, 'rgba(0,0,0,0)');
    topLine.addColorStop(0.5, achievement.color || '#b07030');
    topLine.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topLine;
    ctx.fillRect(0, 0, 1080, 3);

    const cx = 540, cy = 420, r = 155;
    const ringGlow = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 40);
    ringGlow.addColorStop(0, (achievement.glow || 'rgba(184,115,51,0.4)').replace('0.4', '0.45'));
    ringGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ringGlow;
    ctx.beginPath(); ctx.arc(cx, cy, r + 40, 0, Math.PI * 2); ctx.fill();

    const bg = achievement.bg || 'rgba(184,115,51,0.12)';
    const badgeBg = ctx.createRadialGradient(cx - 30, cy - 30, 0, cx, cy, r);
    badgeBg.addColorStop(0, bg.replace('0.12', '0.5'));
    badgeBg.addColorStop(1, bg.replace('0.12', '0.15'));
    ctx.fillStyle = badgeBg;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = (achievement.border || 'rgba(184,115,51,0.3)').replace('0.3', '0.7');
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

    const emojiMap = { Streaks: '🔥', Levels: '⚡', Habits: '✅', XP: '🏆', Special: '✨' };
    ctx.font = '110px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emojiMap[achievement.category] || '🏆', cx, cy);

    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 68px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0e8d8';
    ctx.fillText(achievement.title || 'Achievement', 540, 650);

    ctx.font = '34px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = achievement.color || '#b07030';
    ctx.fillText(achievement.description || '', 540, 710);

    const stats = [`Level ${userStats?.level || 1}`, `${userStats?.xp || 0} XP`, `${userStats?.longest_streak || 0}d streak`];
    const statY = 810;
    stats.forEach((stat, i) => {
      const x = 200 + i * 340;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      roundRectPath(ctx, x - 88, statY - 28, 176, 54, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      roundRectPath(ctx, x - 88, statY - 28, 176, 54, 12);
      ctx.stroke();
      ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#e8dece';
      ctx.textAlign = 'center';
      ctx.fillText(stat, x, statY + 9);
    });

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(100, 900, 880, 1);

    const slabX = 432, slabY = 936;
    [
      { x: slabX, y: slabY,      w: 62, h: 14, r: 4, c0: '#d4954a', c1: '#a06828' },
      { x: slabX+6, y: slabY+18, w: 50, h: 12, r: 3, c0: '#be7430', c1: '#885018' },
      { x: slabX+12, y: slabY+34,w: 38, h: 10, r: 3, c0: '#9a5c20', c1: '#683c10' },
    ].forEach(({ x, y, w, h, r, c0, c1 }) => {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, c0); g.addColorStop(1, c1);
      ctx.fillStyle = g;
      roundRectPath(ctx, x, y, w, h, r);
      ctx.fill();
    });

    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#e8dece';
    ctx.textAlign = 'left';
    ctx.fillText('Slate', slabX + 74, slabY + 35);

    ctx.font = '22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.textAlign = 'center';
    ctx.fillText('slate-app.io', 540, 1046);

    resolve(canvas.toDataURL('image/png', 1.0));
  });
}

// ── getLegacyAchievementDef ───────────────────────────────────────────────────
function getLegacyAchievementDef(data) {
  if (data.type === 'level_up') {
    const level = data.level || 5;
    if (level >= 25) return ACHIEVEMENT_DEFS.find(d => d.id === 'level_25');
    if (level >= 10) return ACHIEVEMENT_DEFS.find(d => d.id === 'level_10');
    return ACHIEVEMENT_DEFS.find(d => d.id === 'level_5');
  }
  if (data.type === 'streak') {
    const streak = data.current_streak || 7;
    if (streak >= 100) return ACHIEVEMENT_DEFS.find(d => d.id === 'streak_100');
    if (streak >= 30)  return ACHIEVEMENT_DEFS.find(d => d.id === 'streak_30');
    if (streak >= 7)   return ACHIEVEMENT_DEFS.find(d => d.id === 'streak_7');
    return ACHIEVEMENT_DEFS.find(d => d.id === 'streak_3');
  }
  return ACHIEVEMENT_DEFS.find(d => d.id === 'early_bird');
}

// ── LegacyOverlayWithShare — with SOUNDS ─────────────────────────────────────
function LegacyOverlayWithShare({ data, userStats, onClose, onShare }) {
  // ── SOUNDS ──────────────────────────────────────────────────────────────────
  const { playLevelUp, playStreak } = useZenithSounds();

  useEffect(() => {
    // Fire the right sound 120 ms after mount so the overlay is visible first
    const soundTimer = setTimeout(() => {
      if (data.type === 'level_up') {
        playLevelUp();
      } else if (data.type === 'streak') {
        playStreak();
      }
    }, 120);

    // Auto-dismiss after 6 s
    const dismissTimer = setTimeout(onClose, 6000);

    return () => {
      clearTimeout(soundTimer);
      clearTimeout(dismissTimer);
    };
  }, [onClose]);
  // ────────────────────────────────────────────────────────────────────────────

  const isLevelUp  = data.type === 'level_up';
  const color      = isLevelUp ? '#c9813a' : '#e07a30';
  const glow       = isLevelUp ? 'rgba(201,129,58,0.35)' : 'rgba(224,122,48,0.3)';
  const matchedDef = getLegacyAchievementDef(data);

  function Particle({ delay }) {
    const angle = Math.random() * 360;
    const dist  = 70 + Math.random() * 110;
    const x     = Math.cos((angle * Math.PI) / 180) * dist;
    const y     = Math.sin((angle * Math.PI) / 180) * dist;
    const colors = ['#c9813a','#e8a45a','#9a5f25','#6fcf8a','#e8c35a'];
    const col    = colors[Math.floor(Math.random() * colors.length)];
    const size   = 4 + Math.random() * 5;
    return (
      <motion.div className="absolute rounded-full pointer-events-none"
        style={{ width: size, height: size, backgroundColor: col, left: '50%', top: '50%', marginLeft: -size/2, marginTop: -size/2 }}
        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
        animate={{ x, y, opacity: 0, scale: 0 }}
        transition={{ duration: 0.7 + Math.random() * 0.4, delay, ease: 'easeOut' }} />
    );
  }

  return createPortal(
    <>
      <motion.div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <div style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ width: '100%', maxWidth: '320px' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="rounded-3xl overflow-hidden border shadow-2xl relative"
            style={{ background: 'var(--color-surface)', borderColor: 'rgba(58,52,46,0.8)' }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />

            <div className="relative flex flex-col items-center text-center px-8 py-8">
              {isLevelUp && Array.from({ length: 18 }).map((_, i) => <Particle key={i} delay={i * 0.02} />)}

              {/* Icon */}
              <motion.div className="relative mb-5"
                initial={{ scale: 0, rotate: isLevelUp ? -180 : 0, y: isLevelUp ? 0 : 20 }}
                animate={{ scale: 1, rotate: 0, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}99)`, boxShadow: `0 20px 60px ${glow}` }}>
                  <span style={{ fontSize: '36px' }}>{isLevelUp ? '⚡' : '🔥'}</span>
                </div>
                <motion.div className="absolute -inset-2 rounded-2xl border-2"
                  style={{ borderColor: `${color}40` }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity }} />
              </motion.div>

              {/* Label */}
              <motion.div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                {isLevelUp ? 'Level Up!' : 'Streak Milestone'}
              </motion.div>

              {/* Title */}
              <motion.h2 className="text-3xl font-black mb-1 tracking-tight" style={{ color: 'var(--color-warm-white)' }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                {isLevelUp ? `Level ${data.level}` : `${data.current_streak} Days 🔥`}
              </motion.h2>

              <motion.p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                {data.message}
              </motion.p>

              {/* Action buttons */}
              <motion.div style={{ display: 'flex', gap: '8px', width: '100%' }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                {matchedDef && (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onShare(matchedDef)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '11px 14px', borderRadius: '14px', fontSize: '13px', fontWeight: 600,
                      color: 'white',
                      background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                      border: `1px solid ${color}55`,
                      cursor: 'pointer',
                      boxShadow: `0 4px 16px ${glow}`,
                    }}
                  >
                    <Share2 size={13} />
                    Share
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '11px 14px', borderRadius: '14px', fontSize: '13px', fontWeight: 600,
                    color: 'var(--color-text-2)', background: 'var(--color-stone)',
                    border: '1px solid var(--color-border)', cursor: 'pointer',
                  }}
                >
                  {matchedDef ? 'Continue →' : 'Keep Going →'}
                </motion.button>
              </motion.div>
            </div>

            {/* Auto-dismiss bar */}
            <motion.div
              initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
              transition={{ duration: 6, ease: 'linear' }}
              style={{ height: '2px', background: `linear-gradient(to right, transparent, ${color})`, transformOrigin: 'left' }}
            />
          </div>
        </motion.div>
      </div>
    </>,
    document.body
  );
}

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}