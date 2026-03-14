import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, BarChart2, BrainCircuit, Timer } from 'lucide-react';

const navItems = [
  { name: 'Home',      path: '/',          icon: LayoutDashboard },
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { name: 'Coach',     path: '/coach',     icon: BrainCircuit },
  { name: 'Timer',     path: '/timer',     icon: Timer },
];

export default function MobileNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around px-2 py-2 border-t"
      style={{
        background: 'rgba(22,19,16,0.95)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(58,52,46,0.8)',
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          end={item.path === '/'}
          className="flex-1"
        >
          {({ isActive }) => (
            <div className="flex flex-col items-center gap-1 py-1 relative">
              {isActive && (
                <motion.div
                  layoutId="mobile-active-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'rgba(201,129,58,0.12)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon
                size={20}
                className="relative z-10 transition-colors"
                style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-muted)' }}
              />
              <span
                className="relative z-10 text-[10px] font-semibold tracking-wide transition-colors"
                style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-muted)' }}
              >
                {item.name}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}