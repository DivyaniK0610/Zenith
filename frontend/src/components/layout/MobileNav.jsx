import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, BarChart2, BrainCircuit, Timer, Target } from 'lucide-react';

const navItems = [
  { name: 'Home',      path: '/',          icon: LayoutDashboard },
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { name: 'Goals',     path: '/goals',     icon: Target },
  { name: 'Coach',     path: '/coach',     icon: BrainCircuit },
  { name: 'Timer',     path: '/timer',     icon: Timer },
];

export default function MobileNav() {
  return (
    <nav
      className="md:hidden"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(13,11,8,0.97)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '6px 4px',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          end={item.path === '/'}
          style={{ flex: 1, textDecoration: 'none' }}
        >
          {({ isActive }) => (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '3px',
              padding: '4px 2px', position: 'relative',
            }}>
              {isActive && (
                <motion.div
                  layoutId="mobile-active-bg"
                  style={{
                    position: 'absolute', inset: 0,
                    borderRadius: '10px', background: 'rgba(184,115,51,0.1)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}

              {/* Active top pip */}
              {isActive && (
                <motion.div
                  layoutId="mobile-active-pip"
                  style={{
                    position: 'absolute', top: '-6px', left: '50%',
                    transform: 'translateX(-50%)',
                    width: '20px', height: '2px', borderRadius: '99px',
                    background: 'var(--color-primary)',
                    boxShadow: '0 0 6px var(--color-primary)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}

              <item.icon
                size={17}
                style={{
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-3)',
                  position: 'relative', zIndex: 1,
                  transition: 'color 0.15s',
                }}
              />
              <span style={{
                fontSize: '9px', fontWeight: 600,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-3)',
                position: 'relative', zIndex: 1,
                transition: 'color 0.15s',
              }}>
                {item.name}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}