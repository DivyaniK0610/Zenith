import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, BarChart2, BrainCircuit, Timer, Target, Trophy } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import ThemeToggle from '../ThemeToggle';
import { useZenithSounds } from '../../hooks/useSound';

const navItems = [
  { name: 'Dashboard',    path: '/',             icon: LayoutDashboard, shortcut: 'D' },
  { name: 'Analytics',    path: '/analytics',    icon: BarChart2,       shortcut: 'A' },
  { name: 'Goals',        path: '/goals',        icon: Target,          shortcut: 'G' },
  { name: 'Achievements', path: '/achievements', icon: Trophy,          shortcut: 'V' },
  { name: 'AI Coach',     path: '/coach',        icon: BrainCircuit,    shortcut: 'C' },
  { name: 'Timer',        path: '/timer',        icon: Timer,           shortcut: 'T' },
];

/**
 * SlateMark — three stacked horizontal slabs tapering inward.
 */
function SlateMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sm-bg" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1c1812"/>
          <stop offset="100%" stopColor="#0c0a08"/>
        </linearGradient>
        <linearGradient id="sm-g1" x1="5" y1="9"  x2="25" y2="9"  gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d4954a"/>
          <stop offset="100%" stopColor="#a06828"/>
        </linearGradient>
        <linearGradient id="sm-g2" x1="7" y1="15" x2="23" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#be7430"/>
          <stop offset="100%" stopColor="#885018"/>
        </linearGradient>
        <linearGradient id="sm-g3" x1="9" y1="21" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9a5c20"/>
          <stop offset="100%" stopColor="#683c10"/>
        </linearGradient>
      </defs>
      <rect width="30" height="30" rx="8" fill="url(#sm-bg)"/>
      <rect x="0" y="0" width="30" height="1" rx="0.5" fill="white" opacity="0.08"/>
      <rect x="5"  y="7"  width="20" height="5" rx="2.5" fill="url(#sm-g1)"/>
      <rect x="5"  y="7"  width="20" height="1" rx="0.5" fill="white" opacity="0.14"/>
      <rect x="7"  y="14" width="16" height="4.5" rx="2.25" fill="url(#sm-g2)"/>
      <rect x="9"  y="20.5" width="12" height="4" rx="2" fill="url(#sm-g3)"/>
    </svg>
  );
}

export default function Sidebar() {
  const { userStats } = useHabitStore();
  const { playNavClick } = useZenithSounds();
  const navigate = useNavigate();
  const level     = userStats?.level || 1;
  const xp        = userStats?.xp    || 0;
  const xpInLevel = xp % 100;
  const progress  = xpInLevel;

  // Keyboard shortcuts: navigate pages (only when not typing in an input)
  useEffect(() => {
    const handler = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
      const item = navItems.find(n => n.shortcut === e.key.toUpperCase());
      if (item) {
        playNavClick();
        navigate(item.path);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, playNavClick]);

  return (
    <div
      className="w-52 h-screen flex-shrink-0 hidden md:flex flex-col relative"
      style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
    >
      <div className="absolute right-0 inset-y-0 w-px pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(184,115,51,0.12) 30%, rgba(184,115,51,0.06) 70%, transparent)' }} />

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-6">
        <SlateMark size={30} />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--color-warm-white)' }}>
          Slate
        </span>
      </div>

      <div className="mx-4 mb-4" style={{ height: '1px', background: 'var(--color-border)' }} />

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.name} to={item.path} end={item.path === '/'} className="block"
            onClick={playNavClick}>
            {({ isActive }) => (
              <div className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
                style={{ background: isActive ? 'rgba(184,115,51,0.1)' : 'transparent', color: isActive ? 'var(--color-warm-white)' : 'var(--color-text-3)' }}>
                {isActive && (
                  <>
                    <motion.div layoutId="sidebar-active-bg" className="absolute inset-0 rounded-xl"
                      style={{ background: 'rgba(184,115,51,0.08)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                    <div className="nav-active-line" />
                  </>
                )}
                <item.icon size={15} className="relative flex-shrink-0"
                  style={{ color: isActive ? 'var(--color-primary)' : 'inherit' }} />
                <span className="relative text-sm" style={{ fontWeight: isActive ? 500 : 400, letterSpacing: '-0.01em', flex: 1 }}>
                  {item.name}
                </span>
                {/* Keyboard shortcut badge */}
                <span style={{
                  fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 600,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-3)',
                  background: isActive ? 'rgba(184,115,51,0.12)' : 'var(--color-stone-mid)',
                  border: `1px solid ${isActive ? 'rgba(184,115,51,0.25)' : 'var(--color-stone-light)'}`,
                  borderRadius: '5px', padding: '1px 5px', opacity: 0.8, flexShrink: 0,
                }}>
                  {item.shortcut}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Theme toggle */}
      <div className="px-4 mb-3">
        <ThemeToggle />
      </div>

      {/* Bottom user card */}
      <div className="mx-4 mb-5 rounded-xl p-3"
        style={{ background: 'var(--color-stone)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
            Level {level}
          </span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
            {xpInLevel}/100
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: 'var(--color-stone-mid)' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--color-primary-dim), var(--color-primary))' }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative flex-shrink-0">
            <svg width="34" height="34" viewBox="0 0 34 34" style={{ position: 'absolute', top: '-1px', left: '-1px', overflow: 'visible' }}>
              <circle cx="17" cy="17" r="15" fill="none" stroke="var(--color-stone-mid)" strokeWidth="1.5" />
              <circle cx="17" cy="17" r="15" fill="none" stroke="var(--color-primary)" strokeWidth="1.5"
                strokeDasharray={`${2 * Math.PI * 15}`}
                strokeDashoffset={`${2 * Math.PI * 15 * (1 - progress / 100)}`}
                strokeLinecap="round" transform="rotate(-90 17 17)"
                style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)', opacity: 0.6 }} />
            </svg>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center relative z-10"
              style={{ background: 'var(--color-stone-mid)', border: '1px solid var(--color-stone-light)' }}>
              <SlateMark size={20} />
            </div>
          </div>
          <div className="min-w-0">
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-1)', letterSpacing: '-0.01em' }}>User</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-3)' }}>Lv {level} · {xp} XP</div>
          </div>
        </div>
      </div>
    </div>
  );
}