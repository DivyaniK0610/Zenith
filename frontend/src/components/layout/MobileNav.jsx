import React, { useEffect, useState } from 'react';
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function MobileNav() {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'rgba(13,11,8,0.97)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'stretch',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
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
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                paddingTop: '10px',
                paddingBottom: '4px',
                position: 'relative',
              }}
            >
              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="mobile-active-bg"
                  style={{
                    position: 'absolute',
                    inset: '4px 8px',
                    borderRadius: '10px',
                    background: 'rgba(184,115,51,0.1)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}

              {/*
                Active pip — centered via margin auto on a block element.
                We avoid absolute positioning here because left/transform
                fights with the layoutId spring. Instead we use a dedicated
                row above the icon that centers naturally.
              */}
              <div style={{ height: '3px', width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '2px' }}>
                {isActive && (
                  <motion.div
                    layoutId="mobile-pip"
                    style={{
                      width: '20px',
                      height: '3px',
                      borderRadius: '99px',
                      background: 'var(--color-primary)',
                      boxShadow: '0 0 6px var(--color-primary)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
              </div>

              <item.icon
                size={17}
                style={{
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-3)',
                  transition: 'color 0.15s',
                  position: 'relative',
                  zIndex: 1,
                }}
              />

              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-3)',
                  transition: 'color 0.15s',
                  position: 'relative',
                  zIndex: 1,
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