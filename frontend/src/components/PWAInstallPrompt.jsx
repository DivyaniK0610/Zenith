import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

/**
 * PWAInstallPrompt
 *
 * Shows a custom install banner for 5 seconds when the browser fires
 * the `beforeinstallprompt` event (Chrome / Android).
 * On iOS Safari it shows a manual instruction banner instead, since
 * Safari doesn't fire beforeinstallprompt.
 *
 * Rules:
 *  - Only shown once per session (localStorage flag)
 *  - Auto-dismisses after 5 seconds
 *  - User can dismiss manually
 */
export default function PWAInstallPrompt() {
  const [show, setShow]           = useState(false);
  const [isIOS, setIsIOS]         = useState(false);
  const [deferredPrompt, setDeferred] = useState(null);
  const timerRef                  = useRef(null);
  const STORAGE_KEY               = 'slate_pwa_dismissed';

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    // Detect iOS Safari
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    const inStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;

    // If already installed as PWA, never show
    if (inStandaloneMode) return;

    if (ios) {
      // Safari on iOS — show manual instruction
      setIsIOS(true);
      setShow(true);
      startTimer();
      return;
    }

    // Chrome / Android — wait for beforeinstallprompt
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
    if (outcome === 'accepted') {
      sessionStorage.setItem(STORAGE_KEY, '1');
    }
    setDeferred(null);
    dismiss();
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom) + 80px)',  // above mobile nav
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9990,
            width: 'calc(100% - 32px)',
            maxWidth: '400px',
            borderRadius: '18px',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-primary-border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(184,115,51,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Top shimmer */}
          <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.6), transparent)', pointerEvents: 'none' }} />

          {/* Progress bar — 5 sec countdown */}
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
            {/* App icon */}
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
              boxShadow: '0 4px 16px rgba(184,115,51,0.3)',
            }}>
              {/* Inline S logo */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M20 7C20 7 17.5 5.5 14.5 5.5C11 5.5 8.5 7.5 8.5 10.5C8.5 13.5 11 14.8 13.5 15.5L16 16.3C18.5 17 20.5 18.3 20.5 21.5C20.5 24.7 18 26.5 14.5 26.5C11.5 26.5 9.5 25 9.5 25"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-warm-white)', letterSpacing: '-0.02em', marginBottom: '2px' }}>
                {isIOS ? 'Add Slate to Home Screen' : 'Install Slate'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-3)', lineHeight: 1.5 }}>
                {isIOS
                  ? 'Tap Share → "Add to Home Screen"'
                  : 'Get the full app experience — offline too'}
              </div>
            </div>

            {/* CTA */}
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
      )}
    </AnimatePresence>
  );
}