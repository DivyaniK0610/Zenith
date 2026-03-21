import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const XP_PER_LEVEL = 100;

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start     = display;
    const end       = value;
    const duration  = 800;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value]);

  return <>{display}</>;
}

// compact=true → slim inline version for use inside the unified progress card
export default function XPBar({ xp = 0, level = 1, compact = false }) {
  const xpInLevel = xp % XP_PER_LEVEL;
  const progress  = (xpInLevel / XP_PER_LEVEL) * 100;

  // ── Compact mode — just the bar + labels, no outer card shell ──────────────
  if (compact) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
              flexShrink: 0,
            }}>
              <Zap size={10} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
              Level
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--color-warm-white)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {level}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500 }}>
              <AnimatedNumber value={xpInLevel} />
            </span>
            <span style={{ color: 'var(--color-text-3)', fontSize: '11px' }}>/ {XP_PER_LEVEL} XP</span>
          </div>
        </div>

        {/* Progress track */}
        <div style={{ height: '5px', borderRadius: '99px', overflow: 'hidden', background: 'var(--color-stone)', position: 'relative' }}>
          <motion.div
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, var(--color-primary-dim), var(--color-primary), #d4954a)',
              borderRadius: '99px',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
          <span style={{ color: 'var(--color-text-3)', fontSize: '10px' }}>
            {Math.round(progress)}% to next level
          </span>
          <span style={{ color: '#6fcf8a', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
            ↑ <AnimatedNumber value={xp} /> total
          </span>
        </div>
      </div>
    );
  }

  // ── Full mode — standalone card with icon (sidebar / standalone use) ────────
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Top shimmer */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.18), transparent)',
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 w-32 h-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(184,115,51,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex items-center gap-4 px-5 py-4">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
            boxShadow: '0 2px 12px rgba(184,115,51,0.25), 0 1px 0 rgba(255,255,255,0.06) inset',
          }}
        >
          <Zap size={16} color="#fff" fill="#fff" />
        </div>

        {/* Bar + labels */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-2.5">
            <div className="flex items-baseline gap-2">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--color-text-3)' }}
              >
                Level
              </span>
              <span
                className="text-xl font-bold leading-none"
                style={{
                  color: 'var(--color-warm-white)',
                  letterSpacing: '-0.03em',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {level}
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span
                style={{
                  color: 'var(--color-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                <AnimatedNumber value={xpInLevel} />
              </span>
              <span style={{ color: 'var(--color-text-3)', fontSize: '11px' }}>
                / {XP_PER_LEVEL} XP
              </span>
            </div>
          </div>

          {/* Progress track */}
          <div
            className="relative h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--color-stone)' }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, var(--color-primary-dim), var(--color-primary), #d4954a)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            />
          </div>

          {/* Sub-labels */}
          <div className="flex justify-between mt-1.5">
            <span style={{ color: 'var(--color-text-3)', fontSize: '10px' }}>
              {Math.round(progress)}% to next level
            </span>
            <span
              style={{
                color: '#6fcf8a',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ↑ <AnimatedNumber value={xp} /> total
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
