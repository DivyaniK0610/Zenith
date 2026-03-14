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

  return (
    <div
      className="w-56 h-screen flex-shrink-0 hidden md:flex flex-col p-5 border-r relative"
      style={{ background: 'var(--color-surface)', borderColor: 'rgba(58,52,46,0.7)' }}
    >
      <div className="absolute inset-y-0 right-0 w-px"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,129,58,0.08), transparent)' }} />

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8 px-1">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #c9813a, #8a4e1a)' }}>
          <Zap size={15} className="text-white" fill="white" />
        </div>
        <span className="text-base font-black tracking-tight" style={{ color: 'var(--color-warm-white)' }}>
          Zenith
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map((item) => (
          <NavLink key={item.name} to={item.path} end={item.path === '/'} className="block">
            {({ isActive }) => (
              <div className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ color: isActive ? 'var(--color-warm-white)' : 'var(--color-muted)' }}>
                {isActive && (
                  <>
                    <motion.div layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'rgba(201,129,58,0.1)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                    <div className="absolute left-0 w-0.5 h-5 rounded-r-full"
                      style={{ background: 'var(--color-primary)' }} />
                  </>
                )}
                <item.icon size={16} className="relative"
                  style={{ color: isActive ? 'var(--color-primary)' : 'inherit' }} />
                <span className="relative">{item.name}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="pt-4 border-t" style={{ borderColor: 'rgba(58,52,46,0.7)' }}>
        <div className="px-1 mb-3">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
            <span>Level {level}</span><span>{xpInLevel}/100 XP</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-stone)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #c9813a, #e8a45a)' }}
              initial={{ width: 0 }} animate={{ width: `${xpInLevel}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
        </div>
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--color-stone-mid)', border: '1px solid var(--color-stone-light)' }}>Z</div>
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--color-warm-white)' }}>User</div>
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Level {level}</div>
          </div>
        </div>
      </div>
    </div>
  );
}