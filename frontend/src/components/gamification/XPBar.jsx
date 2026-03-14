import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const XP_PER_LEVEL = 100;

export default function XPBar({ xp = 0, level = 1 }) {
  const xpInLevel = xp % XP_PER_LEVEL;
  const progress  = (xpInLevel / XP_PER_LEVEL) * 100;

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

      {/* Ambient glow behind icon */}
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
                {xpInLevel}
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
            >
              {/* Shimmer */}
              <motion.div
                className="absolute inset-y-0 w-12 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                }}
                animate={{ x: ['-100%', '500%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
              />
            </motion.div>
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
              ↑ {xp} total
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}