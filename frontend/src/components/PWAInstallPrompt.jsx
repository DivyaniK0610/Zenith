import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

// SlateMark — three stacked horizontal slabs (matches Sidebar)
function SlateMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pwa-sm-bg" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1c1812"/>
          <stop offset="100%" stopColor="#0c0a08"/>
        </linearGradient>
        <linearGradient id="pwa-sm-g1" x1="5" y1="9"  x2="25" y2="9"  gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d4954a"/>
          <stop offset="100%" stopColor="#a06828"/>
        </linearGradient>
        <linearGradient id="pwa-sm-g2" x1="7" y1="15" x2="23" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#be7430"/>
          <stop offset="100%" stopColor="#885018"/>
        </linearGradient>
        <linearGradient id="pwa-sm-g3" x1="9" y1="21" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9a5c20"/>
          <stop offset="100%" stopColor="#683c10"/>
        </linearGradient>
      </defs>
      <rect width="30" height="30" rx="8" fill="url(#pwa-sm-bg)"/>
      <rect x="0" y="0" width="30" height="1" rx="0.5" fill="white" opacity="0.08"/>
      {/* Top slab */}
      <rect x="5"  y="7"  width="20" height="5" rx="2.5" fill="url(#pwa-sm-g1)"/>
      <rect x="5"  y="7"  width="20" height="1" rx="0.5" fill="white" opacity="0.14"/>
      {/* Middle slab */}
      <rect x="7"  y="14" width="16" height="4.5" rx="2.25" fill="url(#pwa-sm-g2)"/>
      {/* Bottom slab */}
      <rect x="9"  y="20.5" width="12" height="4" rx="2" fill="url(#pwa-sm-g3)"/>
    </svg>
  );
}

export default function PWAInstallPrompt() {
  const [show, setShow]               = useState(false);
  const [isIOS, setIsIOS]             = useState(false);
  const [deferredPrompt, setDeferred] = useState(null);
  const timerRef                      = useRef(null);
  const STORAGE_KEY                   = 'slate_pwa_dismissed';

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    const inStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (inStandaloneMode) return;

    if (ios) {
      setIsIOS(true);
      setShow(true);
      startTimer();
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
      startTimer();
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timerRef.current);
    };
  }, []);

  function startTimer() {
    timerRef.current = setTimeout(() => dismiss(), 5000);
  }

  function dismiss() {
    clearTimeout(timerRef.current);
    setShow(false);
    sessionStorage.setItem(STORAGE_KEY, '1');
  }

  async function handleInstall() {
    if (!deferredPrompt) { dismiss(); return; }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') sessionStorage.setItem(STORAGE_KEY, '1');
    setDeferred(null);
    dismiss();
  }

  return (
    <AnimatePresence>
      {show && (
        /*
          Outer wrapper: fixed, full-width, flex row centering.
          This avoids the translateX(-50%) + Framer Motion transform conflict
          that caused the misalignment in the original version.
        */
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom) + 80px)',
            left: 0,
            right: 0,
            zIndex: 9990,
            display: 'flex',
            justifyContent: 'center',
            padding: '0 16px',
            pointerEvents: 'none',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            style={{
              width: '100%',
              maxWidth: '400px',
              borderRadius: '18px',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-primary-border)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(184,115,51,0.1)',
              overflow: 'hidden',
              pointerEvents: 'auto',
              position: 'relative',
            }}
          >
            {/* Top shimmer */}
            <div style={{
              position: 'absolute', inset: '0 0 auto 0', height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.6), transparent)',
              pointerEvents: 'none',
            }} />

            {/* 5-second progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: 'linear' }}
              style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, var(--color-primary-dim), var(--color-primary))',
                transformOrigin: 'left',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px' }}>
              {/* App icon — SlateMark in amber container */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #1c1812, #0c0a08)',
                boxShadow: '0 4px 16px rgba(184,115,51,0.3)',
                border: '1px solid rgba(184,115,51,0.25)',
              }}>
                <SlateMark size={30} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px', fontWeight: 700,
                  color: 'var(--color-warm-white)',
                  letterSpacing: '-0.02em', marginBottom: '2px',
                }}>
                  {isIOS ? 'Add Slate to Home Screen' : 'Install Slate'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-3)', lineHeight: 1.5 }}>
                  {isIOS
                    ? 'Tap Share → "Add to Home Screen"'
                    : 'Get the full app experience — offline too'}
                </div>
              </div>

              {/* Install CTA (non-iOS) */}
              {!isIOS && (
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={handleInstall}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '9px 14px', borderRadius: '10px', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
                    color: 'white', fontSize: '12px', fontWeight: 600,
                    border: '1px solid rgba(184,115,51,0.3)',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(184,115,51,0.25)',
                  }}
                >
                  <Download size={12} />
                  Install
                </motion.button>
              )}

              {/* iOS icon */}
              {isIOS && (
                <div style={{ flexShrink: 0 }}>
                  <Smartphone size={22} style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
                </div>
              )}

              {/* Dismiss */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={dismiss}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-stone)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text-3)', cursor: 'pointer',
                }}
              >
                <X size={12} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}