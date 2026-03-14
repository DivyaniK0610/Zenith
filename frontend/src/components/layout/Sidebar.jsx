import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, BarChart2, BrainCircuit, Timer, Zap } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { name: 'AI Coach', path: '/coach', icon: BrainCircuit },
  { name: 'Timer', path: '/timer', icon: Timer },
];

export default function Sidebar() {
  const { userStats } = useHabitStore();
  const level = userStats?.level || 1;
  const xp = userStats?.xp || 0;
  const xpInLevel = xp % 100;

  return (
    <div className="w-60 h-screen flex-shrink-0 bg-[#0c1526] border-r border-slate-800 p-5 hidden md:flex flex-col relative">
      {/* Top shine */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" />

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8 px-1">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <span className="text-lg font-black text-white tracking-tight">Zenith</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'text-white bg-slate-800/80'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-xl bg-slate-800/80"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-3">
                  <item.icon
                    size={17}
                    className={isActive ? 'text-primary' : ''}
                  />
                  {item.name}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="active-bar"
                    className="absolute left-0 w-0.5 h-5 bg-primary rounded-r-full"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="mt-auto pt-5 border-t border-slate-800">
        {/* Mini XP progress */}
        <div className="px-1 mb-4">
          <div className="flex justify-between text-xs text-slate-600 mb-1.5">
            <span>Level {level}</span>
            <span>{xpInLevel}/100 XP</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${xpInLevel}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 border border-slate-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
            Z
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-300">User</div>
            <div className="text-xs text-slate-600">Level {level}</div>
          </div>
        </div>
      </div>
    </div>
  );
}