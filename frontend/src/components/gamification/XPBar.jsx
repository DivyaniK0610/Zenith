import React from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';

const XP_PER_LEVEL = 100;

export default function XPBar({ xp = 0, level = 1 }) {
  const xpInCurrentLevel = xp % XP_PER_LEVEL;
  const progress = (xpInCurrentLevel / XP_PER_LEVEL) * 100;

  return (
    <div className="bg-surface border border-slate-700/80 rounded-2xl p-5 relative overflow-hidden">
      {/* Subtle bg glow */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Level</div>
              <div className="text-xl font-black text-white leading-none">{level}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">XP</div>
            <div className="text-sm font-bold text-slate-300">
              <span className="text-blue-400">{xpInCurrentLevel}</span>
              <span className="text-slate-600"> / {XP_PER_LEVEL}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full relative"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          >
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
            />
          </motion.div>
        </div>

        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-slate-600">{Math.round(progress)}% to next level</span>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp size={10} />
            <span>{xp} total XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}