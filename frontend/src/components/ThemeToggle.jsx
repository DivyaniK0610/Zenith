import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ThemeToggle — switches between dark and light themes.
 *
 * Places a `data-theme="light"` attribute on <html>.
 * CSS variables in index.css respond to [data-theme="light"] selector.
 *
 * Usage: drop <ThemeToggle /> anywhere in the component tree.
 */
export default function ThemeToggle({ compact = false }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('slate_theme');
      if (saved) return saved === 'dark';
    } catch (_) {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', 'light');
    }
    try { localStorage.setItem('slate_theme', isDark ? 'dark' : 'light'); } catch (_) {}
  }, [isDark]);

  const toggle = () => setIsDark(d => !d);

  if (compact) {
    // Mobile bottom nav / tight spaces — icon-only pill
    return (
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={toggle}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(176,112,48,0.10)',
          border: isDark
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(176,112,48,0.25)',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ opacity: 0, rotate: -30, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 30, scale: 0.6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: '14px', lineHeight: 1, display: 'block' }}
            >
              🌙
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, rotate: 30, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -30, scale: 0.6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: '14px', lineHeight: 1, display: 'block' }}
            >
              ☀️
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  // Full toggle — used in Sidebar
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '8px 10px',
        borderRadius: '12px',
        cursor: 'pointer',
        background: 'transparent',
        border: '1px solid var(--color-border)',
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--color-stone)';
        e.currentTarget.style.borderColor = 'var(--color-primary-border)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
    >
      {/* Track pill */}
      <div
        style={{
          width: '38px',
          height: '22px',
          borderRadius: '99px',
          flexShrink: 0,
          position: 'relative',
          background: isDark
            ? 'var(--color-stone-mid)'
            : 'linear-gradient(135deg, #c8922a, #a06818)',
          border: isDark
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(176,112,48,0.4)',
          transition: 'background 0.3s, border-color 0.3s',
          boxShadow: isDark ? 'none' : '0 0 8px rgba(200,146,42,0.28)',
        }}
      >
        {/* Glide thumb */}
        <motion.div
          animate={{ x: isDark ? 2 : 18 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          style={{
            position: 'absolute',
            top: '2px',
            width: '16px',
            height: '16px',
            borderRadius: '99px',
            background: isDark ? '#888' : '#fff',
            boxShadow: isDark
              ? '0 1px 3px rgba(0,0,0,0.5)'
              : '0 1px 6px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
          }}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.span key="m"
                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                🌙
              </motion.span>
            ) : (
              <motion.span key="s"
                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                ☀️
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <span style={{
        fontSize: '12px',
        fontWeight: 500,
        color: 'var(--color-text-2)',
        letterSpacing: '-0.01em',
        flex: 1,
        textAlign: 'left',
      }}>
        {isDark ? 'Dark mode' : 'Light mode'}
      </span>
    </motion.button>
  );
}