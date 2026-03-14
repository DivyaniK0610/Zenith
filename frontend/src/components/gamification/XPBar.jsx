import React from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';

const XP_PER_LEVEL = 100;

export default function XPBar({ xp = 0, level = 1 }) {
  const xpInLevel = xp % XP_PER_LEVEL;
  const progress  = (xpInLevel / XP_PER_LEVEL) * 100;

  return (
    <div className="relative rounded-2xl p-5 overflow-hidden border"
      style={{ background: 'var(--color-surface)', borderColor: 'rgba(58,52,46,0.8)' }}>
      <div className="absolute right-0 top-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(201,129,58,0.06)' }} />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #c9813a, #8a4e1a)' }}>
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest uppercase mb-0.5"
                style={{ color: 'var(--color-muted)' }}>Level</div>
              <div className="text-2xl font-black leading-none" style={{ color: 'var(--color-warm-white)' }}>{level}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold tracking-wider uppercase mb-0.5" style={{ color: 'var(--color-muted)' }}>XP</div>
            <div className="text-sm font-bold">
              <span style={{ color: 'var(--color-primary)' }}>{xpInLevel}</span>
              <span style={{ color: 'var(--color-stone-light)' }}> / {XP_PER_LEVEL}</span>
            </div>
          </div>
        </div>

        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-stone)' }}>
          <motion.div className="h-full rounded-full relative overflow-hidden"
            style={{ background: 'linear-gradient(90deg, #c9813a, #e8a45a)' }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}>
            <motion.div className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }} />
          </motion.div>
        </div>

        <div className="flex justify-between mt-1.5">
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{Math.round(progress)}% to next level</span>
          <div className="flex items-center gap-1 text-xs" style={{ color: '#6fcf8a' }}>
            <TrendingUp size={10} /><span>{xp} total XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}