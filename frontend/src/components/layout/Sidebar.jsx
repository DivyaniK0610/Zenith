import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, BarChart2, BrainCircuit, Timer, Zap } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';

const navItems = [
  { name: 'Dashboard', path: '/',          icon: LayoutDashboard },
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { name: 'AI Coach',  path: '/coach',     icon: BrainCircuit },
  { name: 'Timer',     path: '/timer',     icon: Timer },
];

export default function Sidebar() {
  const { userStats } = useHabitStore();
  const level     = userStats?.level || 1;
  const xp        = userStats?.xp    || 0;
  const xpInLevel = xp % 100;
  const progress  = xpInLevel;

  return (
    <div
      className="w-52 h-screen flex-shrink-0 hidden md:flex flex-col relative"
      style={{
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* Right edge gradient line */}
      <div
        className="absolute right-0 inset-y-0 w-px pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(184,115,51,0.12) 30%, rgba(184,115,51,0.06) 70%, transparent)',
        }}
      />

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-6">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
            boxShadow: '0 2px 10px rgba(184,115,51,0.3), 0 1px 0 rgba(255,255,255,0.08) inset',
          }}
        >
          <Zap size={14} color="#fff" fill="#fff" />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--color-warm-white)',
          }}
        >
          Zenith
        </span>
      </div>

      {/* Divider */}
      <div
        className="mx-4 mb-4"
        style={{ height: '1px', background: 'var(--color-border)' }}
      />

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {navItems.map((item) => (
          <NavLink key={item.name} to={item.path} end={item.path === '/'} className="block">
            {({ isActive }) => (
              <div
                className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: isActive ? 'rgba(184,115,51,0.1)' : 'transparent',
                  color: isActive ? 'var(--color-warm-white)' : 'var(--color-text-3)',
                }}
              >
                {isActive && (
                  <>
                    <motion.div
                      layoutId="sidebar-active-bg"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'rgba(184,115,51,0.08)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                    {/* Left accent line */}
                    <div className="nav-active-line" />
                  </>
                )}

                <item.icon
                  size={15}
                  className="relative flex-shrink-0"
                  style={{ color: isActive ? 'var(--color-primary)' : 'inherit' }}
                />
                <span
                  className="relative text-sm"
                  style={{
                    fontWeight: isActive ? 500 : 400,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.name}
                </span>

                {/* Active dot */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--color-primary)', opacity: 0.7 }}
                  />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom user section */}
      <div
        className="mx-4 mb-5 mt-4 rounded-xl p-3"
        style={{
          background: 'var(--color-stone)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Mini XP bar */}
        <div className="flex items-center justify-between mb-1.5">
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
            Level {level}
          </span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
            {xpInLevel}/100
          </span>
        </div>
        <div
          className="h-1 rounded-full overflow-hidden mb-3"
          style={{ background: 'var(--color-stone-mid)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--color-primary-dim), var(--color-primary))' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* User row */}
        <div className="flex items-center gap-2.5">
          {/* Avatar with XP ring */}
          <div className="relative flex-shrink-0">
            <svg width="34" height="34" viewBox="0 0 34 34" className="absolute -inset-0.5" style={{ overflow: 'visible' }}>
              <circle
                cx="17" cy="17" r="15"
                fill="none"
                stroke="var(--color-stone-mid)"
                strokeWidth="1.5"
              />
              <circle
                cx="17" cy="17" r="15"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                strokeDasharray={`${2 * Math.PI * 15}`}
                strokeDashoffset={`${2 * Math.PI * 15 * (1 - progress / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 17 17)"
                style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)', opacity: 0.6 }}
              />
            </svg>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold relative z-10"
              style={{
                background: 'var(--color-stone-mid)',
                border: '1px solid var(--color-stone-light)',
                color: 'var(--color-text-2)',
                letterSpacing: '0.01em',
              }}
            >
              Z
            </div>
          </div>

          <div className="min-w-0">
            <div
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-text-1)',
                letterSpacing: '-0.01em',
              }}
            >
              User
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--color-text-3)',
              }}
            >
              Level {level} · {xp} XP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}