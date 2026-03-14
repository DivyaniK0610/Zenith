import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, BarChart2, BrainCircuit, Timer, Zap } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { name: 'AI Coach', path: '/coach', icon: BrainCircuit },
  { name: 'Timer', path: '/timer', icon: Timer },
];

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-surface border-r border-slate-700 p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-10 text-primary">
        <Zap size={32} />
        <h1 className="text-2xl font-bold text-white tracking-tight">Zenith</h1>
      </div>

      <nav className="flex flex-col gap-4 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative ${
                isActive ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-700">
        <div className="flex items-center gap-3 px-4 text-sm text-slate-400">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
            D
          </div>
          <span>User Profile</span>
        </div>
      </div>
    </div>
  );
}