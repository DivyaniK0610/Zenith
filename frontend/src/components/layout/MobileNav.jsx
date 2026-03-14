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
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around px-1 pt-2 pb-safe"
      style={{
        background: 'rgba(13,11,8,0.92)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--color-border)',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
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
                  style={{ background: 'rgba(184,115,51,0.1)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}

              <item.icon
                size={18}
                className="relative z-10 transition-colors"
                style={{
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-3)',
                }}
              />
              <span
                className="relative z-10 transition-colors"
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-3)',
                }}
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